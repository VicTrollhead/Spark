import { useState, useEffect } from "react";
import { Head, useForm } from "@inertiajs/react";
import backgroundImg from "../../assets/images/background.png";
import titleLogin from "../../assets/images/title_login.png";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import googleIcon from "../../assets/images/google_icon.png";
import visibilityIcon from "../../assets/images/visibility.png";

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
        <div className="relative flex h-screen flex-col">
            <Head title="Log in" />
            <div className="flex flex-grow">
                <div
                    className="relative w-1/2 bg-cover bg-center"
                    style={{ backgroundImage: `url(${backgroundImg})` }}
                >
                    <img
                        src={titleLogin}
                        alt="Title"
                        className="absolute top-1/10 left-1/4 h-auto w-2/4"
                    />
                </div>
                <div className="flex w-1/2 items-center justify-center bg-white">
                    <div className="w-96 rounded-2xl p-8">
                        <h1 className="mb-4 text-4xl font-bold text-black">У зоні комфорту</h1>
                        <h2 className="mb-6 text-2xl font-bold text-black">Приєднуйтесь до Spark.</h2>
                        <p className="mb-4 font-bold text-black">Увійдіть в обліковий запис</p>

                        <div id="g_id_onload" data-client_id={googleClientId} data-callback="handleCredentialResponse"></div>
                        <div className="g_id_signin" data-type="standard"></div>

                        <div className="my-4 flex items-center">
                            <div className="flex-grow border-t border-gray-700"></div>
                            <span className="px-2 font-bold text-gray-500">або</span>
                            <div className="flex-grow border-t border-gray-700"></div>
                        </div>
                        <form onSubmit={submit}>
                            <Input
                                type="email"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                placeholder="Телефон або пошта"
                                className="mb-4 w-full rounded-2xl text-black selection:bg-blue-600 selection:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required
                            />
                            <div className="relative mb-4 w-full">
                                <Input
                                    type={passwordVisible ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    placeholder="Пароль"
                                    className="w-full rounded-2xl pr-10 text-black selection:bg-blue-600 selection:text-white focus:border-blue-500"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-3 flex items-center"
                                    onClick={togglePasswordVisibility}
                                >
                                    <img
                                        src={visibilityIcon}
                                        alt="Toggle Visibility"
                                        className="h-5 w-5 hover:cursor-pointer"
                                    />
                                </button>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData("remember", e.target.checked)}
                                    className="mr-2"
                                />
                                <span className="font-bold text-gray-900">Запам’ятати</span>
                                {canResetPassword && (
                                    <a href={route("password.request")} className="ml-auto text-blue-600 hover:underline">
                                        Забули пароль?
                                    </a>
                                )}
                            </div>
                            <Button
                                type="submit"
                                className="mb-2 w-full rounded-2xl border-3 border-blue-500 bg-blue-500 text-white hover:cursor-pointer hover:bg-white hover:text-blue-500"
                                disabled={processing}
                            >
                                Увійти
                            </Button>
                        </form>
                        <div className="mt-4 text-left">
                            <span className="font-bold text-gray-900">Не маєте акаунту?</span>
                            <Button
                                className="mb-2 w-full rounded-2xl border-3 border-blue-500 bg-blue-500 text-white hover:cursor-pointer hover:bg-white hover:text-blue-500"
                                onClick={() => (window.location.href = route("register"))}
                            >
                                Зареєструватися
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <footer className=" absolute bottom-0 right-0 w-1/2 bg-transparent p-4 text-center text-sm text-gray-500">
                <div className="flex flex-wrap justify-center gap-4">
                    <a href="#" className="hover:underline">Про нас</a>
                    <a href="#" className="hover:underline">Умови надання послуг</a>
                    <a href="#" className="hover:underline">Політика конфіденційності</a>
                    <a href="#" className="hover:underline">Політика щодо файлів cookie</a>
                    <a href="#" className="hover:underline">Контактні та реєстраційні дані</a>
                    <a href="#" className="hover:underline">Спеціальні можливості</a>
                    <a href="#" className="hover:underline">Інформація про рекламу</a>
                    <a href="#" className="hover:underline">Блог</a>
                    <a href="#" className="hover:underline">Реклама</a>
                    <a href="#" className="hover:underline">Налаштування</a>
                    © 2025 SparkCorp.
                </div>
            </footer>
        </div>
    );
}
