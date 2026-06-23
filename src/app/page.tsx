import { createGame } from "@/actions/game-actions";

export default function Home() {
  return (
    <main>
      <h1>HOLA DESDE VERCEL</h1>
    </main>
  );
}

// export default function HomePage() {
//   return (
//     <main className="flex min-h-screen flex-col items-center justify-center gap-6">

//       <form action={createGame}>
//         <button
//           type="submit"
//           className="bg-blue-600 text-white px-6 py-3 rounded"
//         >
//           Crear partida
//         </button>
//       </form>

//       <div className="text-gray-400">
//         o
//       </div>

//       <form action="/join">
//         <input
//           name="code"
//           placeholder="Código de partida"
//           className="border p-2 rounded uppercase"
//         />

//         <button
//           type="submit"
//           className="ml-2 bg-green-600 text-white px-4 py-2 rounded"
//         >
//           Unirse
//         </button>
//       </form>

//     </main>
//   );
// }