export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-2">{eyebrow}</p>
        )}
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {description && (
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed max-w-2xl">{description}</p>
        )}
      </div>
      {children}
    </header>
  );
}
