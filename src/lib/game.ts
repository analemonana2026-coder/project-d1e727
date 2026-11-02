export const START_TIME = 20;
export const PENALTY = 2;
export const MIN_TIME = 8;
export const QUESTION_COUNT = 100;

/** Wrong answer or timeout: next question gets 2 seconds less (min 8). Correct keeps the time. */
export function nextTime(current: number, correct: boolean): number {
  return correct ? current : Math.max(MIN_TIME, current - PENALTY);
}

/** Reaching the minimum time means the game is lost. */
export function isLost(time: number): boolean {
  return time <= MIN_TIME;
}

export function formatClock(sec: number): string {
  const s = Math.floor(sec);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export const CATEGORIES = [
  "Bankeinzug abgelehnt",
  "Zugestellt, aber nicht erhalten",
  "Defekt / passt nicht",
  "Lieferverzögerung",
  "Marketplace (Drittanbieter)",
  "A-Z-Garantie abgelehnt",
];

/** Countries in the order of the 6x5 character sheet (row by row). */
export const COUNTRIES = [
  "Ägypten", "Mexiko", "Indien", "USA", "Frankreich", "Deutschland",
  "Italien", "Türkei", "Japan", "China", "Russland", "Großbritannien",
  "Spanien", "Saudi-Arabien", "Niederlande", "Griechenland", "Polen", "Thailand",
  "Brasilien", "Argentinien", "Kanada", "Australien", "Irland", "Kambodscha",
  "Marokko", "Indonesien", "Südkorea", "Südafrika", "Kenia", "VAE",
];

const [BANK, ZUG, DEF, VER, MKT, AZ] = CATEGORIES as [string, string, string, string, string, string];

const RAW: Record<string, string[]> = {
  [BANK]: [
    "Hallo, ich wollte bestellen, aber ich habe eine E-Mail bekommen, dass mein Bankkonto als Zahlungsart abgelehnt wurde. Ich nutze das Konto doch schon seit Jahren!",
    "Bei meiner Lastschrift gibt es ein Problem. Ich kann mit meinem Konto nicht mehr bezahlen.",
    "Warum wird meine Bankverbindung nicht mehr akzeptiert? Gestern ging es noch.",
    "Ich bekomme ständig die Meldung, dass der Bankeinzug nicht möglich ist.",
    "Amazon schreibt mir, die Lastschrift sei zurückgegangen. Mein Konto ist aber gedeckt!",
    "Ich habe meine IBAN neu eingegeben, trotzdem wird die Zahlung per Bankeinzug abgelehnt.",
    "Meine Bank sagt, alles ist in Ordnung, aber Amazon lehnt mein Konto ab. Wie kann das sein?",
    "Ich kann nicht mehr per Lastschrift zahlen, die Option ist plötzlich gesperrt.",
    "Es heißt, meine Zahlungsart wurde abgelehnt. Ich zahle immer per Bankeinzug.",
    "Nach einer Rücklastschrift kann ich mein Konto nicht mehr nutzen. Was muss ich tun?",
    "Ich möchte meine Bestellung abschließen, aber das Bankkonto wird einfach nicht angenommen.",
    "Die Abbuchung von meinem Girokonto hat nicht geklappt und jetzt ist meine Bestellung blockiert.",
    "Meine Lastschrift wurde verweigert, obwohl ich genug Geld auf dem Konto habe.",
    "Ich habe ein neues Konto hinzugefügt, doch der Einzug wird sofort abgelehnt.",
    "Warum steht da 'Zahlung fehlgeschlagen'? Ich habe doch meine Bankdaten hinterlegt.",
    "Seit letzter Woche funktioniert mein Bankeinzug nicht mehr. Können Sie das freischalten?",
    "Ich habe eine Nachricht bekommen: Ihre Bankverbindung kann nicht verwendet werden. Warum?",
  ],
  [ZUG]: [
    "Guten Tag, laut Sendungsverfolgung wurde mein Paket gestern zugestellt, aber ich habe nichts bekommen. Es ist nicht vor der Tür und auch nicht beim Nachbarn.",
    "Der Fahrer hat angeblich das Paket zugestellt, aber bei mir ist nichts angekommen. Wo ist mein Paket?",
    "In der App steht 'Zugestellt', aber mein Briefkasten ist leer.",
    "Ich war den ganzen Tag zu Hause, und trotzdem soll das Paket zugestellt worden sein.",
    "Es steht da, das Paket wurde an einem sicheren Ort abgelegt. Ich finde es nirgends.",
    "Das Paket wurde laut Amazon beim Nachbarn abgegeben, aber der Nachbar hat nichts.",
    "Ich habe ein Zustellfoto bekommen, aber das ist gar nicht meine Haustür!",
    "Meine Bestellung ist als geliefert markiert, aber ich habe sie nie in der Hand gehabt.",
    "Der Status sagt zugestellt, doch weder an der Rezeption noch im Paketraum ist etwas.",
    "Angeblich wurde mein Paket persönlich übergeben. Ich habe aber nichts unterschrieben.",
    "Ich habe überall gesucht, Garage, Garten, Nachbarn – das gelieferte Paket ist nicht da.",
    "Die Sendung wurde laut Tracking heute Morgen zugestellt, aber es ist nichts angekommen.",
    "Mein Paket soll in der Packstation liegen, aber ich habe keinen Abholcode bekommen und es ist leer.",
    "Zugestellt um 14 Uhr, sagt die Verfolgung. Ich war da, niemand hat geklingelt, kein Paket.",
    "Vielleicht wurde mein Paket gestohlen? Es steht 'zugestellt', aber es ist weg.",
    "Ich habe nur einen leeren Umschlag bekommen, obwohl die Bestellung als geliefert gilt.",
    "Der Bote hat das Paket wohl an eine falsche Adresse gebracht. Bei mir ist es nicht.",
  ],
  [DEF]: [
    "Ich habe einen Wasserkocher bestellt und er funktioniert überhaupt nicht. Er ist kaputt angekommen.",
    "Die Schuhe, die ich bestellt habe, sind mir zu klein. Sie passen leider gar nicht.",
    "Der Bildschirm meines neuen Tablets hat einen Riss. So kann ich es nicht benutzen.",
    "Die Jacke ist viel zu groß, ich möchte sie umtauschen.",
    "Mein Staubsauger geht nach zwei Tagen nicht mehr an.",
    "Die Hose passt überhaupt nicht, obwohl ich meine normale Größe bestellt habe.",
    "Das Ladekabel lädt mein Handy nicht. Es ist defekt.",
    "Beim Auspacken habe ich gesehen, dass die Tasse zerbrochen ist.",
    "Die Kopfhörer haben nur auf einer Seite Ton. Das ist ein Defekt.",
    "Das Ersatzteil passt nicht zu meinem Gerät, obwohl es als kompatibel angegeben war.",
    "Der Mixer macht komische Geräusche und riecht verbrannt.",
    "Das Kleid ist an der Naht gerissen, schon beim ersten Anziehen.",
    "Die Handyhülle passt nicht auf mein Modell. Die Kamera ist verdeckt.",
    "Die Lampe flackert die ganze Zeit. Ich glaube, sie ist kaputt.",
    "Der Drucker zeigt sofort eine Fehlermeldung und druckt nichts.",
    "Der Ring ist mir zu eng, ich brauche eine andere Größe.",
    "Das Spielzeug ist beschädigt angekommen, ein Teil fehlt und eins ist abgebrochen.",
  ],
  [VER]: [
    "Meine Bestellung sollte schon vor drei Tagen ankommen. Ich warte immer noch und ich bin Prime-Kunde!",
    "Ich habe Eilversand bezahlt und das Paket ist immer noch nicht da. Das ist unakzeptabel!",
    "Das voraussichtliche Lieferdatum ist schon vorbei. Wann kommt mein Paket?",
    "Die Sendungsverfolgung bewegt sich seit einer Woche nicht mehr.",
    "Mein Paket hängt im Verteilzentrum fest. Es kommt einfach nicht weiter.",
    "Ich brauche das Geschenk bis Freitag, aber die Lieferung verschiebt sich ständig.",
    "Es heißt jetzt 'Lieferung verzögert'. Ich habe extra für morgen bestellt!",
    "Seit zehn Tagen warte ich auf meine Bestellung. Wo bleibt sie?",
    "Der Liefertermin wurde schon zum dritten Mal verschoben.",
    "Das Paket ist noch unterwegs, obwohl es gestern ankommen sollte.",
    "Ich bin Prime-Mitglied, aber meine Same-Day-Lieferung ist nicht gekommen.",
    "Mein Paket ist laut Tracking noch nicht mal verschickt, dabei sollte es heute da sein.",
    "Die Bestellung steht seit Tagen auf 'In Zustellung', aber es passiert nichts.",
    "Wie lange muss ich noch warten? Die Lieferung ist schon eine Woche zu spät.",
    "Ich habe frische Lebensmittel bestellt und die Lieferung kommt zu spät.",
    "Das Paket war für Montag angekündigt, heute ist Donnerstag und nichts ist da.",
    "Warum dauert die Lieferung so lange? Ich habe für schnelle Zustellung extra bezahlt.",
  ],
  [MKT]: [
    "Ich habe bei einem anderen Verkäufer auf Amazon bestellt und er antwortet mir einfach nicht. Was kann ich tun?",
    "Der Händler auf Amazon hat meine Rücksendung nicht akzeptiert. Es ist nicht Amazon selbst.",
    "Mein Artikel wird von einem Drittanbieter verkauft und der hat ihn nie verschickt.",
    "Ein externer Verkäufer will mir mein Geld nicht zurückgeben.",
    "Ich habe dem Verkäufer dreimal geschrieben, keine Antwort. Er verkauft nur über Amazon.",
    "Der Shop, bei dem ich über Amazon gekauft habe, hat meine Bestellung storniert, aber nicht erstattet.",
    "Der Drittanbieter verlangt, dass ich die Rücksendung selbst bezahle. Ist das erlaubt?",
    "Ich habe die falsche Ware von einem Marketplace-Händler bekommen und er reagiert nicht.",
    "Der Verkäufer ist aus China und sagt, ich soll das Paket dorthin zurückschicken.",
    "Mein Produkt kam von 'Versand durch Verkäufer' und das Tracking funktioniert nicht.",
    "Der Händler hat mir per E-Mail angeboten, außerhalb von Amazon zu zahlen. Ist das sicher?",
    "Ich möchte mich über einen Verkäufer auf dem Marketplace beschweren.",
    "Der Drittanbieter hat meine Rechnung nicht geschickt, obwohl ich sie mehrmals angefordert habe.",
    "Das Angebot war von einem Fremdhändler, und jetzt ist sein Shop nicht mehr erreichbar.",
    "Der Verkäufer behauptet, er hätte mir das Geld erstattet, aber ich habe nichts bekommen.",
    "Ich habe Probleme mit einem Händler, nicht mit Amazon. Er hält seine Versprechen nicht.",
    "Meine Bestellung wurde vom Verkäufer versendet, nicht von Amazon, und er antwortet nicht.",
  ],
  [AZ]: [
    "Ich habe die A-bis-Z-Garantie beantragt, aber jetzt steht da, dass sie abgelehnt wurde. Warum denn?",
    "Mein Garantieantrag gegen den Verkäufer wurde abgelehnt. Das ist ungerecht!",
    "Amazon hat meinen A-bis-Z-Antrag nicht genehmigt. Kann ich Einspruch einlegen?",
    "Ich habe eine Garantie-Erstattung beantragt und bekomme nur eine Absage.",
    "Warum wurde meine A-bis-Z-Garantie verweigert? Der Verkäufer hat doch nichts geliefert.",
    "Mein Antrag auf die Amazon-Garantie wurde wegen fehlender Nachweise abgelehnt.",
    "Die A-bis-Z-Garantie wurde abgelehnt, weil ich angeblich zu spät war. Stimmt das?",
    "Ich möchte gegen die Ablehnung meines Garantieantrags vorgehen.",
    "Der Verkäufer hat nicht reagiert, also habe ich die Garantie genutzt, aber sie wurde abgelehnt.",
    "Meine Erstattung über die A-bis-Z-Garantie ist abgelehnt worden. Was jetzt?",
    "Es heißt, mein Garantiefall ist geschlossen und abgelehnt. Ich verstehe das nicht.",
    "Ich habe den Artikel zurückgeschickt, trotzdem wurde mein A-bis-Z-Antrag abgewiesen.",
    "Amazon schreibt, die Garantie gilt nicht für meinen Fall. Warum nicht?",
    "Mein zweiter Antrag auf die A-bis-Z-Garantie wurde wieder abgelehnt.",
    "Die Garantie wurde abgelehnt, weil ich eine Rückbuchung bei der Bank gemacht habe. Ist das richtig?",
    "Ich habe alle Fotos geschickt, aber die A-bis-Z-Garantie wurde trotzdem verweigert.",
    "Kann mir jemand erklären, warum mein Garantie-Antrag gegen den Händler nicht akzeptiert wurde?",
  ],
};

export const CASES: { text: string; answer: string }[] = Object.entries(RAW).flatMap(([answer, texts]) =>
  texts.map((text) => ({ text, answer })),
);
