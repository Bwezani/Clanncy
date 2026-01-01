export default function Footer() {
  return (
    <footer className="border-t mt-auto bg-background/50">
      <div className="container mx-auto py-6 px-4 md:px-6">
        <p className="text-center text-sm text-foreground/70">
          © {new Date().getFullYear()} Curbside. All rights reserved. Built for students, by cluck enthusiasts.
        </p>
      </div>
    </footer>
  );
}
