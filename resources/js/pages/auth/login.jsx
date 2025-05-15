import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import InputError from '../../components/input-error';
import TextLink from '../../components/text-link';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import PasswordVisibilityToggle from '../../components/ui/password-visibility-button';
import { Label } from '../../components/ui/label';
import AuthLayout from '../../layouts/auth-layout';
import { useState, useEffect } from 'react';

export default function Login({ status, canResetPassword, googleClientId }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const { translations } = usePage().props;
    const [passwordVisible, setPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => setPasswordVisible((prev) => !prev);

    const navigateToRegister = () => {
        window.location.href = route('register');
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    function handleCredentialResponse(response) {
        fetch("/api/auth/google/callback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector("meta[name='csrf-token']").getAttribute("content"),
            },
            body: JSON.stringify({ token: response.credential }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    window.location.href = "/dashboard";
                }
            })
            .catch((error) => console.error("Google Sign-In Error:", error));
    }

    useEffect(() => {
        window.handleCredentialResponse = handleCredentialResponse;

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
    }, []);

    return (
        <AuthLayout title={translations["Log in to Spark"]} description={translations["Use google authentication or email to log in"]}>
            <Head title={translations['Log In']} />
            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-5">

                    {/* Google Sign-In block */}
                    <div id="g_id_onload"
                         data-client_id={googleClientId || '980020201753-diubrb4qni06ji66kvfpvem23bfcgiur.apps.googleusercontent.com'}
                         data-callback="handleCredentialResponse">
                    </div>
                    <div className="g_id_signin" data-type="standard"></div>

                    <div className="my-1 flex items-center">
                        <div className="flex-grow border border-t"></div>
                        <span className="px-2 font-bold">{translations["OR"]}</span>
                        <div className="flex-grow border border-t"></div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">{translations["Email Address"]}</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder={translations["email@example.com"]}
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">{translations["Password"]}</Label>
                        <div className="flex gap-1.5">
                            <Input
                                id="password"
                                type={passwordVisible ? 'text' : 'password'}
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder={translations["Password"]}
                            />
                            <PasswordVisibilityToggle visible={passwordVisible} onToggle={togglePasswordVisibility} />
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        {translations["Log In"]}
                    </Button>

                    <div className="flex items-center space-x-3">
                        <Checkbox id="remember" name="remember" tabIndex={3} />
                        <Label htmlFor="remember">{translations["Remember Me"]}</Label>
                        {canResetPassword && (
                            <TextLink href={route('password.request')} className="ml-auto text-sm" tabIndex={5}>
                                {translations["Forgot Password"]}?
                            </TextLink>
                        )}
                    </div>
                </div>

                <Button type="button" onClick={navigateToRegister} className="mt-4 w-full" tabIndex={5}>
                    {translations["Sign Up"]}
                </Button>
            </form>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
