export const START_TIME = 10;
export const PENALTY = 2;
export const MIN_TIME = 2;

/** Wrong answer or timeout: next question gets 2 seconds less (min 2). Correct keeps the time. */
export function nextTime(current: number, correct: boolean): number {
  return correct ? current : Math.max(MIN_TIME, current - PENALTY);
}

export const CATEGORIES = [
  "Bankeinzug abgelehnt",
  "Zugestellt, aber nicht erhalten",
  "Defekt / passt nicht",
  "Lieferverzögerung",
  "Marketplace (Drittanbieter)",
  "A-Z-Garantie abgelehnt",
];

export const CASES: { text: string; answer: string }[] = [
  { text: "Hallo, ich wollte bestellen, aber ich habe eine E-Mail bekommen, dass mein Bankkonto als Zahlungsart abgelehnt wurde. Ich nutze das Konto doch schon seit Jahren!", answer: "Bankeinzug abgelehnt" },
  { text: "Guten Tag, laut Sendungsverfolgung wurde mein Paket gestern zugestellt, aber ich habe nichts bekommen. Es ist nicht vor der Tür und auch nicht beim Nachbarn.", answer: "Zugestellt, aber nicht erhalten" },
  { text: "Ich habe einen Wasserkocher bestellt und er funktioniert überhaupt nicht. Er ist kaputt angekommen.", answer: "Defekt / passt nicht" },
  { text: "Die Schuhe, die ich bestellt habe, sind mir zu klein. Sie passen leider gar nicht.", answer: "Defekt / passt nicht" },
  { text: "Meine Bestellung sollte schon vor drei Tagen ankommen. Ich warte immer noch und ich bin Prime-Kunde!", answer: "Lieferverzögerung" },
  { text: "Ich habe bei einem anderen Verkäufer auf Amazon bestellt und er antwortet mir einfach nicht. Was kann ich tun?", answer: "Marketplace (Drittanbieter)" },
  { text: "Ich habe die A-bis-Z-Garantie beantragt, aber jetzt steht da, dass sie abgelehnt wurde. Warum denn?", answer: "A-Z-Garantie abgelehnt" },
  { text: "Ich habe Eilversand bezahlt und das Paket ist immer noch nicht da. Das ist unakzeptabel!", answer: "Lieferverzögerung" },
  { text: "Bei meiner Lastschrift gibt es ein Problem. Ich kann mit meinem Konto nicht mehr bezahlen.", answer: "Bankeinzug abgelehnt" },
  { text: "Der Fahrer hat angeblich das Paket zugestellt, aber bei mir ist nichts angekommen. Wo ist mein Paket?", answer: "Zugestellt, aber nicht erhalten" },
];
