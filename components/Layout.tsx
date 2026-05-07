'use client'
import Header from "./Header";

export default function Layout({children}:{children: React.ReactNode}) {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-white">
                <div className="container mx-auto px-4 py-2">
                    <Header/>
                </div>
            </header>
            <main className="flex-grow">
                {children}
            </main>
            <footer className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-2 text-center">
                    <p>Copyright &copy; 2026 My Meta Node Stake</p>
                </div>
            </footer>
        </div>
    )
}