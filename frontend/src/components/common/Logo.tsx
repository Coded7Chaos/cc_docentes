import './Logo.css';

interface LogoProps {
    image: string;
}

export const Logo = ({image}: LogoProps) => {
    return (
        <div className="logo">
            <img src={image} alt="Logo" />
        </div>
    );
}