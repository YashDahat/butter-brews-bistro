export default function FormErrors({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div role="alert" className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm">
      <ul className="list-disc pl-5">{errors.map(e => <li key={e}>{e}</li>)}</ul>
    </div>
  );
}
export const errCls = (bad: boolean) => (bad ? 'border-destructive focus-visible:ring-destructive' : '');
