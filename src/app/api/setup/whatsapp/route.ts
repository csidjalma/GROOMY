import { NextRequest, NextResponse } from "next/server";

type Action = "status" | "qr" | "info" | "logout" | "restart";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, evolution_url, evolution_token, evolution_instance } = body as {
      action: Action;
      evolution_url: string;
      evolution_token: string;
      evolution_instance: string;
    };

    if (!evolution_url || !evolution_token || !evolution_instance) {
      return NextResponse.json({ error: "URL, Token e Instância são obrigatórios." }, { status: 400 });
    }

    const base = evolution_url.replace(/\/$/, "");
    const headers: Record<string, string> = {
      apikey: evolution_token,
      "Content-Type": "application/json",
    };

    // ── Status da conexão ────────────────────────────────────────────────────
    if (action === "status") {
      const res = await fetch(`${base}/instance/connectionState/${evolution_instance}`, {
        headers,
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json().catch(() => ({}));
      const state: string = data?.instance?.state ?? data?.state ?? "unknown";
      return NextResponse.json({ ok: true, state });
    }

    // ── Info do telefone conectado ───────────────────────────────────────────
    if (action === "info") {
      const res = await fetch(
        `${base}/instance/fetchInstances?instanceName=${encodeURIComponent(evolution_instance)}`,
        { headers, signal: AbortSignal.timeout(8000) }
      );
      const raw = await res.json().catch(() => ([]));

      const instances: any[] = Array.isArray(raw)
        ? raw
        : raw?.data
          ? (Array.isArray(raw.data) ? raw.data : [raw.data])
          : [raw];

      const inst = instances.find(
        (i: any) =>
          i?.instance?.instanceName === evolution_instance ||
          i?.instanceName === evolution_instance ||
          instances.length === 1
      );

      const ownerJid: string =
        inst?.ownerJid ??
        inst?.instance?.ownerJid ??
        inst?.owner ??
        inst?.instance?.owner ??
        inst?.wuid ??
        "";

      const profileName: string =
        inst?.profileName ??
        inst?.instance?.profileName ??
        inst?.name ??
        inst?.instance?.name ??
        "";

      const rawPhone = ownerJid.replace(/@.+$/, "");
      const phone = rawPhone.replace(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/, "+$1 ($2) $3-$4") || rawPhone;

      return NextResponse.json({ ok: true, phone, profileName, ownerJid });
    }

    // ── Restart da instância ─────────────────────────────────────────────────
    if (action === "restart") {
      const res = await fetch(`${base}/instance/restart/${evolution_instance}`, {
        method: "PUT",
        headers,
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: data?.message ?? "Falha ao reiniciar instância." });
      }
      return NextResponse.json({ ok: true });
    }

    // ── Logout / Desconectar ─────────────────────────────────────────────────
    if (action === "logout") {
      const res = await fetch(`${base}/instance/logout/${evolution_instance}`, {
        method: "DELETE",
        headers,
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: data?.message ?? "Falha ao desconectar." });
      }
      return NextResponse.json({ ok: true });
    }

    // ── Gerar QR Code ────────────────────────────────────────────────────────
    const res = await fetch(`${base}/instance/connect/${evolution_instance}`, {
      headers,
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data?.message ?? data?.error ?? `HTTP ${res.status}`;
      return NextResponse.json({ ok: false, error: `Evolution API: ${errMsg}` }, { status: 502 });
    }

    const rawQr: string | null =
      data?.base64 ??
      data?.qrcode?.base64 ??
      data?.data?.base64 ??
      data?.data?.qrcode?.base64 ??
      null;

    const qrCode = rawQr
      ? rawQr.startsWith("data:") ? rawQr : `data:image/png;base64,${rawQr}`
      : null;

    if (!qrCode) {
      const state: string = data?.instance?.state ?? data?.state ?? "open";
      return NextResponse.json({ ok: true, qrCode: null, state });
    }

    return NextResponse.json({ ok: true, qrCode });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? "Erro ao conectar à Evolution API." },
      { status: 500 }
    );
  }
}
