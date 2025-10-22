export function Button({ variant="default", className="", ...props }) {
  const base = "px-4 py-2 rounded-2xl shadow text-sm transition border";
  const variants = {
    default: "bg-black text-white border-black",
    secondary: "bg-white text-slate-900 border-slate-200",
    ghost: "bg-transparent text-slate-900 border-transparent",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
