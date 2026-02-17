import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CancelSignupPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const email = typeof sp.email === "string" ? sp.email : "";
  const token = typeof sp.token === "string" ? sp.token : "";
  const status = typeof sp.status === "string" ? sp.status : "";

  const title = "Wasn’t you?";

  if (status === "done") {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
          처리됐어. (미인증 계정이면 삭제됨)
        </p>
        <div className="mt-6 flex gap-3 text-sm">
          <Link className="underline" href="/signup">
            Sign up
          </Link>
          <Link className="underline" href="/login">
            Login
          </Link>
        </div>
      </main>
    );
  }

  if (status === "invalid") {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
          링크가 유효하지 않거나 만료됐어.
        </p>
        <div className="mt-6 flex gap-3 text-sm">
          <Link className="underline" href="/login">
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  if (!email || !token) {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
          email/token이 필요해.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
        이 회원가입이 네가 한 게 아니라면, 아래 버튼을 눌러서 미인증 계정을 삭제할 수 있어.
      </p>

      <div className="mt-4 rounded-xl border border-black/10 bg-white p-3 text-xs dark:border-white/15 dark:bg-zinc-950">
        <div className="text-zinc-500">Email</div>
        <div className="mt-1 break-all font-medium">{email}</div>
      </div>

      <form className="mt-6" method="POST" action="/api/auth/cancel">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="token" value={token} />
        <button className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-black">
          Delete signup
        </button>
      </form>

      <p className="mt-6 text-xs text-zinc-500">
        이미 인증된 계정은 여기서 삭제되지 않아.
      </p>

      <div className="mt-6 text-sm">
        <Link className="underline" href="/verify">
          Go to verify page
        </Link>
      </div>
    </main>
  );
}
