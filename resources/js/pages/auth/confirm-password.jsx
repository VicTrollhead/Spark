// Components
import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PasswordVisibilityToggle from '@/components/ui/password-visibility-button';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { useState } from 'react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });
    const { translations } = usePage().props;
    const [pwVisible, setPwVisible] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (<AuthLayout title={translations["Confirm your password"]} description={translations["This is a secure area of the application. Please confirm your password before continuing."]}>
            <Head title={translations["Confirm password"]}/>

            <form onSubmit={submit}>
                <div className="space-y-6">
                    <div className="grid gap-4">
                        <Label htmlFor="password">{translations["Password"]}</Label>
                        <div className="flex gap-1.5">
                            <Input id="password" type={pwVisible ? 'text' : 'password'} name="password" placeholder={translations["Password"]} autoComplete="current-password" value={data.password} autoFocus onChange={(e) => setData('password', e.target.value)}/>
                            <PasswordVisibilityToggle visible={pwVisible} onToggle={() => setPwVisible((v) => !v)} />
                        </div>

                        <InputError message={errors.password}/>
                    </div>

                    <div className="flex items-center">
                        <Button className="w-full" disabled={processing}>
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin"/>}
                            {translations["Confirm password"]}
                        </Button>
                    </div>
                </div>
            </form>
        </AuthLayout>);
}
