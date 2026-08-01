import type { ErrorNode, ProcStatementNode } from "../../parser/index.ts";

export type ProcStatement = ProcStatementNode | ErrorNode;