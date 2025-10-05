// src/pages/NotFound.jsx

import { trackPageView } from "@/lib/analytics";
import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Unlink } from 'lucide-react';


const BrokenLinkIcon = () => (
  <Unlink className="mx-auto h-24 w-24 text-indigo-500" />
);


const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      `404 Error: Rota não encontrada. O usuário tentou acessar: ${location.pathname}`
    );
  }, [location.pathname]);
   useEffect(() => {

      trackPageView('404', 'Not Found');

    }, []);

  return (
    <main className="flex w-full flex-col items-center justify-center max-h-full px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 text-center ">
        <BrokenLinkIcon />
        <h1 className="mt-6 text-6xl font-black text-indigo-600 md:text-8xl">
          404
        </h1>
        <p className="mt-4 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Página Não Encontrada
        </p>
        <p className="mt-4 text-base leading-7 text-gray-600">
          Oops! A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-md bg-indigo-600 px-6 py-3 text-center font-semibold text-white shadow-md transition-transform duration-200 ease-in-out hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Voltar para a Home
        </Link>
      </div>
    </main>
  );
};

export default NotFound;