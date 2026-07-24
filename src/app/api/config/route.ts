import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/config - reads all keys from tbl_config
export async function GET() {
  try {
    const rows = await query<any[]>("SELECT cfg_key, cfg_value, cfg_group FROM tbl_config");
    const config: Record<string, string> = {};
    for (const row of rows) {
      config[row.cfg_key] = row.cfg_value ?? "";
    }
    return NextResponse.json({ ok: true, config });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// POST /api/config - saves an array of configs to tbl_config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configs } = body as {
      configs: Array<{ key: string; value: string; type?: string; group?: string; label?: string; desc?: string }>;
    };

    if (!Array.isArray(configs) || configs.length === 0) {
      return NextResponse.json({ error: "Nenhuma configuração enviada." }, { status: 400 });
    }

    for (const item of configs) {
      await query(
        `INSERT INTO tbl_config (cfg_key, cfg_value, cfg_type, cfg_group, cfg_label, cfg_description)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE cfg_value = VALUES(cfg_value)`,
        [
          item.key,
          item.value ?? "",
          item.type ?? "string",
          item.group ?? "general",
          item.label ?? item.key,
          item.desc ?? "",
        ]
      );
    }

    return NextResponse.json({ ok: true, message: `${configs.length} configuração(ões) salva(s)!` });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
