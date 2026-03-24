// lib/utils/copy.ts
// Retorna o texto correto conforme o modo do usuário (individual ou casal).
// isCouple = !!couple (resultado do useCouple())
export function c(isCouple: boolean, solo: string, couple: string): string {
  return isCouple ? couple : solo
}
