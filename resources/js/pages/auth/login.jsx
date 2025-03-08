import backgroundImg from "../../assets/images/background.png";
import titleLogin from "../../assets/images/title_login.png";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import googleIcon from "../../assets/images/google_icon.png";
import visibilityIcon from "../../assets/images/visibility.png";
export default function Login() {
    return (
        <div className="relative flex h-screen flex-col">
            <div className="flex flex-grow">

                <div className="relative w-1/2 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImg})` }}>
          
                    <img src={titleLogin} alt="Title" className="absolute top-20 left-20 h-auto w-3/4" />
                </div>


                <div className="flex w-1/2 items-center justify-center bg-white">
                    <div className="w-96 rounded-2xl p-8">
                        <h1 className="mb-4 text-4xl font-bold text-black">У зоні комфорту</h1>
                        <h2 className="mb-6 text-2xl font-bold text-gray-700">Приєднуйтесь до Spark.</h2>
                        <p className="mb-4 font-bold text-black">Увійдіть в обліковий запис</p>
                        <Button className="bg-primary mb-4 w-full rounded-2xl text-white" disabled={false}>
                            <img src={googleIcon} alt="Google Icon" className="h-5 w-5" />
                            Увійти через акаунт Google
                        </Button>
                        <div className="my-4 flex items-center">
                            <div className="flex-grow border-t border-gray-700"></div>
                            <span className="px-2 font-bold text-gray-500">або</span>
                            <div className="flex-grow border-t border-gray-700"></div>
                        </div>

                        <Input
                            type="text"
                            placeholder="Телефон або пошта"
                            className="mb-4 w-full rounded-2xl text-black selection:bg-blue-600 selection:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="relative mb-4 w-full">
                            <Input
                                type="password"
                                placeholder="Пароль"
                                className="w-full rounded-2xl pr-10 text-black selection:bg-blue-600 selection:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <button type="button" className="absolute inset-y-0 right-3 flex items-center" onClick={togglePasswordVisibility}>
                                <img src={visibilityIcon} alt="Toggle Visibility" className="h-5 w-5" />
                            </button>
                        </div>

                        <Button className="bg-primary mb-2 w-full rounded-2xl text-white" disabled={false}>
                            Увійти
                        </Button>
                        <div className="flex items-center">
                            <input type="checkbox" className="mr-2" />
                            <span className="font-bold text-gray-900">Запам’ятати</span>
                            <a href="#" className="ml-auto text-blue-600 hover:underline">
                                Забули пароль?
                            </a>
                        </div>

                        <div className="mt-4 text-left">
                            <span className="font-bold text-gray-900">Не маєте акаунту?</span>
                            <Button className="bg-primary mt-2 w-full rounded-2xl text-white" disabled={false}>
                                Зареєструватися
                            </Button>
                            <p className="mt-2 text-sm text-gray-500">
                                Реєструючись, ви погоджуєтесь і приймаєте наші{' '}
                                <a href="#" className="text-blue-600 hover:underline">
                                    Умови надання послуг
                                </a>
                                ,{' '}
                                <a href="#" className="text-blue-600 hover:underline">
                                    Політику конфіденційності
                                </a>{' '}
                                та{' '}
                                <a href="#" className="text-blue-600 hover:underline">
                                    Політику використання cookie
                                </a>
                                .
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="absolute bottom-0 left-0 w-full bg-transparent p-4 text-center text-sm text-gray-500">
                <div className="flex flex-wrap justify-center gap-4">
                    <a href="#" className="hover:underline">
                        Про нас
                    </a>
                    <a href="#" className="hover:underline">
                        Умови надання послуг
                    </a>
                    <a href="#" className="hover:underline">
                        Політика конфіденційності
                    </a>
                    <a href="#" className="hover:underline">
                        Політика щодо файлів cookie
                    </a>
                    <a href="#" className="hover:underline">
                        Контактні та реєстраційні дані
                    </a>
                    <a href="#" className="hover:underline">
                        Спеціальні можливості
                    </a>
                    <a href="#" className="hover:underline">
                        Інформація про рекламу
                    </a>
                    <a href="#" className="hover:underline">
                        Блог
                    </a>
                    <a href="#" className="hover:underline">
                        Реклама
                    </a>
                    <a href="#" className="hover:underline">
                        Налаштування
                    </a>
                    © 2025 SparkCorp.
                </div>
            </footer>
        </div>
    );
}

function togglePasswordVisibility() {

}
