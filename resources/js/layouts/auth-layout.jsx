import AuthLayoutTemplate from '../layouts/auth/auth-simple-layout';
import authSrc from '../assets/images/auth-layout-bg.png';
export default function AuthLayout({ children, title, description, ...props }) {
    return (<AuthLayoutTemplate title={title} description={description} imageSrc={authSrc} {...props}>
            {children}
        </AuthLayoutTemplate>);
}

