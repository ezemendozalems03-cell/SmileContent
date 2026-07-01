import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <div className="text-lg font-semibold tracking-tight">Content OS</div>
        <p className="text-sm text-muted-foreground">Sistema interno de OpusWebs</p>
      </div>
      <LoginForm />
    </div>
  );
}
