import { useRouteError } from "react-router-dom";

const ErrorPage = () => {
    const error: any = useRouteError();
    console.error(error);

    return (
        <div id="error-page" className="flex flex-col items-center justify-center min-h-screen text-center">
            <h1 className="text-4xl font-bold mb-4">Oops!</h1>
            <p className="text-xl mb-2">Sorry, an unexpected error has occurred.</p>
            <p className="text-gray-500">
                <i>{error.statusText || error.message}</i>
            </p>
        </div>
    );
}

export default ErrorPage; 