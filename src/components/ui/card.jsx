export function Card({ className="", ...props }) {
  return <div className={`bg-white rounded-2xl shadow ${className}`} {...props} />;
}
export function CardHeader({ className="", ...props }) {
  return <div className={`p-4 border-b ${className}`} {...props} />;
}
export function CardTitle({ className="", ...props }) {
  return <div className={`text-lg font-semibold ${className}`} {...props} />;
}
export function CardContent({ className="", ...props }) {
  return <div className={`p-4 ${className}`} {...props} />;
}
