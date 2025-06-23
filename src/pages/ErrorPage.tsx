import { useRouteError } from "react-router-dom";

const ErrorPage = () => {
    const error: any = useRouteError();
    console.error(error);

    return (
        <div id="error-page" className="flex flex-col items-center justify-center min-h-screen bg-background text-center">
            <div className="bg-white rounded-2xl shadow-soft p-10 max-w-lg w-full">
                <h1 className="text-5xl font-extrabold mb-6 text-gray-900">Oops!</h1>
                <p className="text-2xl mb-4 text-gray-700">Sorry, an unexpected error has occurred.</p>
                <p className="text-gray-500">
                    <i>{error.statusText || error.message}</i>
                </p>
            </div>
        </div>
    );
}

export default ErrorPage; 