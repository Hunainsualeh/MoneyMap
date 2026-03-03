import { NextRequest, NextResponse } from "next/server";

// POST /api/templates/export - Export template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, expenses, budgets, todos, initialBalance, tabs, theme } = body;

    const template = {
      _moneymap_template: true,
      version: "2.0",
      name: name || "Untitled Template",
      description: description || "",
      createdAt: new Date().toISOString(),
      data: {
        expenses: expenses || [],
        budgets: budgets || [],
        todos: todos || [],
        initialBalance: initialBalance ?? 0,
        tabs: tabs || null,
        theme: theme || null,
      },
    };

    return NextResponse.json({ template });
  } catch (error) {
    console.error("POST /api/templates/export error:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

// PUT /api/templates/export - Validate & parse an imported template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate it's a MoneyMap template
    if (!body._moneymap_template) {
      return NextResponse.json(
        { error: "Invalid MoneyMap template file. Missing template signature." },
        { status: 400 }
      );
    }

    const data = body.data || body;

    return NextResponse.json({
      valid: true,
      template: {
        name: body.name || "Imported Template",
        description: body.description || "",
        version: body.version || "1.0",
        createdAt: body.createdAt || null,
        data: {
          expenses: data.expenses || [],
          budgets: data.budgets || [],
          todos: data.todos || [],
          initialBalance: data.initialBalance ?? 0,
          tabs: data.tabs || null,
          theme: data.theme || null,
        },
      },
    });
  } catch (error) {
    console.error("PUT /api/templates/export error:", error);
    return NextResponse.json({ error: "Failed to parse template" }, { status: 500 });
  }
}
