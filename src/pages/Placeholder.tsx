
export function Placeholder({ title }: { title: string }) {
    return (
        <div className="p-8 text-center text-[--text-secondary]">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <p>This module is under construction.</p>
        </div>
    );
}
