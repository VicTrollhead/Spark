#!/usr/bin/env php
<?php

/**
 * Translation Key Audit Script
 *
 * Compares translation keys used in JSX files (translations['key']) against
 * the language files in lang/ to find missing or unused keys.
 *
 * Usage: php scripts/audit-translations.php [--fix]
 *   --fix    Auto-add missing keys to language files with English as placeholder
 */
$projectRoot = dirname(__DIR__);
$langDir = $projectRoot.'/lang';
$jsDir = $projectRoot.'/resources/js';

// Parse CLI args
$fix = in_array('--fix', $argv);

// 1. Extract all translation keys used in JSX files
$usedKeys = [];
$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($jsDir, RecursiveDirectoryIterator::SKIP_DOTS)
);

foreach ($iterator as $file) {
    if (! in_array($file->getExtension(), ['jsx', 'js'])) {
        continue;
    }

    $content = file_get_contents($file->getPathname());

    // Match translations['key'] and translations["key"]
    preg_match_all("/translations\[(['\"])(.+?)\\1\]/", $content, $matches);
    foreach ($matches[2] as $key) {
        $usedKeys[$key] = $usedKeys[$key] ?? [];
        $relativePath = str_replace($projectRoot.'/', '', $file->getPathname());
        if (! in_array($relativePath, $usedKeys[$key])) {
            $usedKeys[$key][] = $relativePath;
        }
    }

    // Match trans_choice('common.key', ...) in PHP-generated content
    preg_match_all("/trans_choice\(['\"]common\.(.+?)['\"],/", $content, $tcMatches);
    foreach ($tcMatches[1] as $key) {
        $usedKeys[$key] = $usedKeys[$key] ?? [];
    }
}

// Also scan PHP files for translation usage
$phpDirs = [$projectRoot.'/app', $projectRoot.'/resources/views'];
foreach ($phpDirs as $dir) {
    if (! is_dir($dir)) {
        continue;
    }
    $phpIterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS)
    );
    foreach ($phpIterator as $file) {
        if ($file->getExtension() !== 'php') {
            continue;
        }
        $content = file_get_contents($file->getPathname());
        preg_match_all("/trans_choice\(['\"]common\.(.+?)['\"],/", $content, $tcMatches);
        foreach ($tcMatches[1] as $key) {
            $usedKeys[$key] = $usedKeys[$key] ?? [];
        }
        preg_match_all("/__\(['\"]common\.(.+?)['\"](\)|,)/", $content, $tMatches);
        foreach ($tMatches[1] as $key) {
            $usedKeys[$key] = $usedKeys[$key] ?? [];
        }
    }
}

ksort($usedKeys);
$totalUsed = count($usedKeys);

// 2. Load all language files
$languages = [];
foreach (scandir($langDir) as $lang) {
    if ($lang === '.' || $lang === '..') {
        continue;
    }
    $commonFile = "$langDir/$lang/common.php";
    if (file_exists($commonFile)) {
        $languages[$lang] = include $commonFile;
    }
}

// 3. Compare and report

echo "\n🔍 Translation Key Audit\n";
echo str_repeat('=', 60)."\n\n";
echo "Found $totalUsed translation keys used in code\n";
echo 'Languages found: '.implode(', ', array_keys($languages))."\n\n";

// Find missing keys per language
$hasIssues = false;
$missingByLang = [];

foreach ($languages as $lang => $keys) {
    $missing = array_diff_key($usedKeys, $keys);
    if (! empty($missing)) {
        $hasIssues = true;
        $missingByLang[$lang] = $missing;
        echo "❌ Missing in [$lang]: ".count($missing)." keys\n";
        foreach ($missing as $key => $files) {
            echo "   - \"$key\"";
            if (! empty($files)) {
                echo ' (used in '.basename($files[0]).(count($files) > 1 ? ' +'.(count($files) - 1).' more' : '').')';
            }
            echo "\n";
        }
        echo "\n";
    } else {
        echo "✅ [$lang] — all keys present\n";
    }
}

// Find unused keys (in lang files but never referenced in code)
echo "\n".str_repeat('-', 60)."\n\n";
foreach ($languages as $lang => $keys) {
    $unused = array_diff_key($keys, $usedKeys);
    // Remove pluralization keys that might be used via trans_choice
    $unused = array_filter($unused, function ($val, $key) {
        return ! str_contains($key, '_count');
    }, ARRAY_FILTER_USE_BOTH);

    if (! empty($unused)) {
        echo "⚠️  Potentially unused in [$lang]: ".count($unused)." keys\n";
        foreach ($unused as $key => $val) {
            echo "   - \"$key\"\n";
        }
        echo "\n";
    } else {
        echo "✅ [$lang] — no unused keys\n";
    }
}

// 4. Auto-fix if requested
if ($fix && ! empty($missingByLang)) {
    echo "\n".str_repeat('=', 60)."\n";
    echo "🔧 Auto-fix mode: adding missing keys...\n\n";

    foreach ($missingByLang as $lang => $missing) {
        $commonFile = "$langDir/$lang/common.php";
        $existing = include $commonFile;

        foreach ($missing as $key => $files) {
            // Use English value if available, otherwise the key itself
            $existing[$key] = $languages['en'][$key] ?? $key;
        }

        // Write back
        $export = var_export($existing, true);
        $export = preg_replace('/^array \(/', '[', $export);
        $export = preg_replace('/\)$/', ']', $export);
        $export = str_replace('array (', '[', $export);
        $export = str_replace(')', ']', $export);

        $content = "<?php\n\n// resources/lang/$lang/common.php\nreturn $export;\n";
        file_put_contents($commonFile, $content);
        echo "   ✅ Updated $commonFile (added ".count($missing)." keys)\n";
    }
}

echo "\n";
exit($hasIssues ? 1 : 0);
