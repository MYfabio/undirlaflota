"use client";

/**
 * Panell de docent.
 * - Sense sessió de Google: convida a entrar-hi.
 * - Alumne amb Google: pot demanar accés com a docent (queda pendent de validació).
 * - Docent: crea classes (codi), veu l'alumnat i les seves estadístiques, exporta CSV, tanca o reobre.
 * - Superadmin: a més, valida les sol·licituds de docent i veu totes les classes.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useT } from "@/components/LangProvider";

type Role = "student" | "teacher" | "superadmin";
interface Me {
  session: { username: string } | null;
  google: boolean;
  role: Role;
  teacherStatus: "none" | "pending" | "active" | "rejected";
  viaGoogle: boolean;
}
interface ClassRow {
  id: string;
  code: string;
  school: string;
  course: string;
  teacher: string;
  closed: boolean;
  students: number;
  games: number;
}
interface Student {
  id: string;
  username: string;
  games: number;
  wins: number;
  accuracy: number;
  hits: number;
  shots: number;
  sunk: number;
  last_played: string | null;
}
interface Request {
  email: string;
  name: string;
  status: "pending" | "active" | "rejected";
  classes: number;
}

export default function DocentPage() {
  const { t, lang } = useT();
  const [me, setMe] = useState<Me | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[] | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [course, setCourse] = useState("");
  const [school, setSchool] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const staff = me?.role === "teacher" || me?.role === "superadmin";

  const loadClasses = useCallback(async () => {
    const r = await fetch("/api/teacher/classes");
    if (!r.ok) return setError(t("teacher.errLoad"));
    const d = (await r.json()) as { classes: ClassRow[] };
    setClasses(d.classes);
    setSchool((s) => s || d.classes[0]?.school || "");
  }, [t]);

  const loadRequests = useCallback(async () => {
    const r = await fetch("/api/teacher/requests");
    if (r.ok) setRequests(((await r.json()) as { users: Request[] }).users);
  }, []);

  useEffect(() => {
    fetch("/api/auth/login")
      .then((r) => r.json())
      .then((d: Me) => setMe(d))
      .catch(() => setMe({ session: null, google: false, role: "student", teacherStatus: "none", viaGoogle: false }));
  }, []);

  useEffect(() => {
    if (!staff) return;
    loadClasses();
    if (me?.role === "superadmin") loadRequests();
  }, [staff, me?.role, loadClasses, loadRequests]);

  async function createClass(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch("/api/teacher/classes", { method: "POST", body: JSON.stringify({ course, school }) });
    setBusy(false);
    if (!r.ok) return setError(t(r.status === 409 ? "teacher.errLimit" : "teacher.errCreate"));
    setCourse("");
    loadClasses();
  }

  async function toggleOpen(c: ClassRow) {
    if (open === c.id) return setOpen(null);
    setOpen(c.id);
    setStudents(null);
    const r = await fetch(`/api/teacher/classes/${c.id}`);
    setStudents(r.ok ? ((await r.json()) as { students: Student[] }).students : []);
  }

  async function setClosed(c: ClassRow, closed: boolean) {
    if (closed && !window.confirm(t("teacher.confirmClose", { code: c.code }))) return;
    await fetch(`/api/teacher/classes/${c.id}`, { method: "PATCH", body: JSON.stringify({ open: !closed }) });
    loadClasses();
  }

  async function removeStudent(c: ClassRow, s: Student) {
    if (!window.confirm(t("teacher.confirmRemove", { name: s.username }))) return;
    const r = await fetch(`/api/teacher/classes/${c.id}?player=${s.id}`, { method: "DELETE" });
    if (r.ok) {
      setStudents((list) => (list ?? []).filter((x) => x.id !== s.id));
      loadClasses();
    }
  }

  async function decide(email: string, status: "active" | "rejected") {
    await fetch("/api/teacher/requests", { method: "PATCH", body: JSON.stringify({ email, status }) });
    loadRequests();
  }

  async function requestAccess() {
    setBusy(true);
    const r = await fetch("/api/teacher/requests", { method: "POST" });
    setBusy(false);
    if (r.ok && me) setMe({ ...me, teacherStatus: ((await r.json()) as { teacherStatus: Me["teacherStatus"] }).teacherStatus });
  }

  function copy(code: string) {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => {});
  }

  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString(lang) : "—");
  const pending = requests.filter((r) => r.status === "pending");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-black">{t("teacher.title")}</h1>
        <p className="mt-1 text-mar-100/75">{t("teacher.subtitle")}</p>

        {!me ? (
          <p className="mt-8 text-mar-300/70">{t("teacher.loading")}</p>
        ) : !staff ? (
          <section className="card mt-8 max-w-xl space-y-4">
            {!me.viaGoogle ? (
              <>
                <p>{t("teacher.needGoogle")}</p>
                {me.google ? (
                  <a href="/api/auth/google" className="btn-primary">{t("login.google")}</a>
                ) : (
                  <p className="text-sm text-perill">{t("login.err.google-off")}</p>
                )}
              </>
            ) : me.teacherStatus === "pending" ? (
              <p>⏳ {t("teacher.pending")}</p>
            ) : me.teacherStatus === "rejected" ? (
              <p className="text-perill">{t("teacher.rejected")}</p>
            ) : (
              <>
                <p>{t("teacher.askText")}</p>
                <button className="btn-primary" onClick={requestAccess} disabled={busy}>{t("teacher.ask")}</button>
              </>
            )}
            <Link href="/login" className="block text-sm underline">{t("teacher.backLogin")}</Link>
          </section>
        ) : (
          <>
            {me.role === "superadmin" && (
              <section className="card mt-8">
                <h2 className="text-xl font-extrabold">
                  {t("teacher.requests")} {pending.length > 0 && <span className="chip ml-2 border-batalla/50 text-batalla">{pending.length}</span>}
                </h2>
                {requests.length === 0 ? (
                  <p className="mt-2 text-sm text-mar-100/70">{t("teacher.noRequests")}</p>
                ) : (
                  <ul className="mt-3 divide-y divide-mar-300/10">
                    {requests.map((r) => (
                      <li key={r.email} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div>
                          <p className="font-bold">{r.name || r.email}</p>
                          <p className="text-xs text-mar-100/70">{r.email} · {t(`teacher.status.${r.status}`)} · {t("teacher.nClasses", { n: r.classes })}</p>
                        </div>
                        <div className="flex gap-2">
                          {r.status !== "active" && <button className="btn-success !px-3 !py-2 text-sm" onClick={() => decide(r.email, "active")}>{t("teacher.approve")}</button>}
                          {r.status !== "rejected" && <button className="btn-secondary !px-3 !py-2 text-sm" onClick={() => decide(r.email, "rejected")}>{t(r.status === "active" ? "teacher.revoke" : "teacher.reject")}</button>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            <section className="card mt-8">
              <h2 className="text-xl font-extrabold">{t("teacher.newClass")}</h2>
              <form onSubmit={createClass} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <label className="block">
                  <span className="text-sm font-bold">{t("teacher.course")}</span>
                  <input className="input mt-1" placeholder="3r ESO A" value={course} onChange={(e) => setCourse(e.target.value)} minLength={2} maxLength={40} required />
                </label>
                <label className="block">
                  <span className="text-sm font-bold">{t("teacher.school")}</span>
                  <input className="input mt-1" placeholder="Institut…" value={school} onChange={(e) => setSchool(e.target.value)} minLength={2} maxLength={80} required />
                </label>
                <button className="btn-primary" disabled={busy}>{t("teacher.create")}</button>
              </form>
              <p className="mt-2 text-xs text-mar-300/70">{t("teacher.createHint")}</p>
              {error && <p className="mt-2 text-sm font-bold text-perill">{error}</p>}
            </section>

            <section className="mt-8 space-y-4">
              <h2 className="text-xl font-extrabold">{t(me.role === "superadmin" ? "teacher.allClasses" : "teacher.myClasses")}</h2>
              {classes.length === 0 && <p className="text-sm text-mar-100/70">{t("teacher.noClasses")}</p>}
              {classes.map((c) => (
                <article key={c.id} className="card">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-extrabold">
                        {c.course} {c.closed && <span className="chip ml-1 border-perill/50 text-perill">{t("teacher.closed")}</span>}
                      </p>
                      <p className="text-xs text-mar-100/70">{c.school} · {c.teacher} · {t("teacher.nStudents", { n: c.students })} · {t("teacher.nGames", { n: c.games })}</p>
                    </div>
                    <button onClick={() => copy(c.code)} className="coord rounded-xl border border-batalla/50 bg-mar-950/70 px-4 py-2 text-xl font-black text-batalla" title={t("teacher.copy")}>
                      {copied === c.code ? t("teacher.copied") : c.code}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="btn-secondary !px-3 !py-2 text-sm" onClick={() => toggleOpen(c)}>{t(open === c.id ? "teacher.hide" : "teacher.show")}</button>
                    <a className="btn-secondary !px-3 !py-2 text-sm" href={`/api/teacher/classes/${c.id}?format=csv`}>{t("teacher.csv")}</a>
                    <button className="btn-secondary !px-3 !py-2 text-sm" onClick={() => setClosed(c, !c.closed)}>{t(c.closed ? "teacher.reopen" : "teacher.close")}</button>
                  </div>
                  {open === c.id && (
                    <div className="mt-4 overflow-x-auto">
                      {!students ? (
                        <p className="text-sm text-mar-300/70">{t("teacher.loading")}</p>
                      ) : students.length === 0 ? (
                        <p className="text-sm text-mar-100/70">{t("teacher.noStudents", { code: c.code })}</p>
                      ) : (
                        <table className="w-full min-w-[560px] text-left text-sm">
                          <thead className="text-xs uppercase text-mar-300/70">
                            <tr>
                              <th className="py-2">{t("teacher.col.student")}</th>
                              <th>{t("teacher.col.games")}</th>
                              <th>{t("teacher.col.wins")}</th>
                              <th>{t("teacher.col.accuracy")}</th>
                              <th>{t("teacher.col.sunk")}</th>
                              <th>{t("teacher.col.last")}</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-mar-300/10">
                            {students.map((s) => (
                              <tr key={s.id}>
                                <td className="py-2 font-bold">{s.username}</td>
                                <td className="coord">{s.games}</td>
                                <td className="coord">{s.wins}</td>
                                <td className="coord">{s.shots ? `${s.accuracy}% (${s.hits}/${s.shots})` : "—"}</td>
                                <td className="coord">{s.sunk}</td>
                                <td>{fmtDate(s.last_played)}</td>
                                <td className="text-right">
                                  <button className="text-xs text-perill underline" onClick={() => removeStudent(c, s)}>{t("teacher.remove")}</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
