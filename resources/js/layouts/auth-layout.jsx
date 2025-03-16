import AuthLayoutTemplate from '../layouts/auth/auth-simple-layout';

export default function AuthLayout({ children, title, description, ...props }) {
    return (<AuthLayoutTemplate title={title} description={description} imageSrc={'/images/bglogin.png'} {...props}>
            {children}
        </AuthLayoutTemplate>);
}

