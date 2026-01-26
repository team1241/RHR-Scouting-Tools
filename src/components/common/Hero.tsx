export default function Hero({ text }: { text: string }) {
  return (
    <header className="space-y-2">
      <h1 className="text-4xl font-semibold leading-tight text-ink md:text-5xl">
        {text}
      </h1>
    </header>
  );
}
