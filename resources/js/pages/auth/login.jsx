import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, EyeOff } from 'lucide-react';
import InputError from '../../components/input-error';
import TextLink from '../../components/text-link';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import AuthLayout from '../../layouts/auth-layout';
import { useState, useEffect } from 'react';

export default function Login({ status, canResetPassword, googleClientId }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const [passwordVisible, setPasswordVisible] = useState(false);

    function togglePasswordVisibility() {
        setPasswordVisible((prev) => !prev);
    }

    const submit = (e) => {
        e.preventDefault();
        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    useEffect(() => {
        window.handleCredentialResponse = function (response) {
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
                    window.location.href = "/dashboard";
                })
                .catch((error) => console.error("Error:", error));
        };

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
    }, []);

    return (
        <AuthLayout title="Log in to Spark" description="Use google authentication or email to log in">
            <Head title="Log in"/>

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-5">
                    <div id="g_id_onload"
                         data-client_id={googleClientId}
                         data-callback="handleCredentialResponse">
                    </div>
                    <div className="g_id_signin" data-type="standard"></div>

                    <script src="https://accounts.google.com/gsi/client" async defer></script>


                    <div className="my-1 flex items-center">
                        <div className="flex-grow border-t border"></div>
                        <span className="px-2 font-bold ">OR</span>
                        <div className="flex-grow border-t border"></div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input id="email" type="email" required autoFocus tabIndex={1} autoComplete="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="email@example.com"/>
                        <InputError message={errors.email}/>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="flex gap-1.5">
                            <Input id="password" type={passwordVisible ? "text" : "password"} required tabIndex={2} autoComplete="current-password" value={data.password}
                                   onChange={(e) => setData('password', e.target.value)} placeholder="Password"/>
                            <button type="button" className=" flex items-center" onClick={togglePasswordVisibility}>
                                <EyeOff className="h-5 w-5 hover:cursor-pointer"/>
                            </button>
                        </div>

                        <InputError message={errors.password}/>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox id="remember" name="remember" tabIndex={3}/>
                        <Label htmlFor="remember">Remember me</Label>
                        {canResetPassword && (<TextLink href={route('password.request')} className="ml-auto text-sm" tabIndex={5}>
                            Forgot password?
                        </TextLink>)}
                    </div>

                    <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin"/>}
                        Log in
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    Don't have an account?{' '}
                    <TextLink href={route('register')} tabIndex={5}>
                        Sign up
                    </TextLink>
                </div>
            </form>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}


