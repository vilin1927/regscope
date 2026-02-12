import { Regulation } from "./types";

export const carpentryRegulations: Regulation[] = [
  // ═══════════════════════════════════════════════════════════════════════════════
  // ARBEITSSICHERHEIT (~8 Vorschriften)
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: "arbschg",
    name: "Arbeitsschutzgesetz (ArbSchG)",
    officialReference: "ArbSchG §§ 3–14",
    jurisdiction: "bund",
    category: "arbeitssicherheit",
    summary:
      "Das Arbeitsschutzgesetz verpflichtet jeden Arbeitgeber, die Sicherheit und den Gesundheitsschutz der Beschäftigten bei der Arbeit zu gewährleisten. Dazu gehören die Durchführung von Gefährdungsbeurteilungen, die Unterweisung der Mitarbeiter und die Bereitstellung sicherer Arbeitsmittel. In Tischlereien ist dies besonders relevant aufgrund der Arbeit mit schweren Maschinen und gesundheitsgefährdenden Holzstäuben.",
    keyRequirements: [
      "Gefährdungsbeurteilung für alle Arbeitsplätze erstellen und dokumentieren",
      "Regelmäßige Sicherheitsunterweisungen (mindestens jährlich) durchführen",
      "Persönliche Schutzausrüstung (PSA) bereitstellen und deren Nutzung sicherstellen",
      "Ersthelfer benennen und Erste-Hilfe-Material vorhalten",
      "Betriebsanweisungen für gefährliche Arbeitsmittel erstellen",
    ],
    potentialPenalty: "Bußgeld bis 25.000 €, bei Vorsatz Freiheitsstrafe bis 1 Jahr",
    riskLevel: "hoch",
    sourceUrl: "https://www.gesetze-im-internet.de/arbschg/",
    appliesWhen: [
      { field: "employeeCount", operator: "gt", value: "0" },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Als Betrieb mit {employeeCount} Mitarbeitern sind Sie verpflichtet, den Arbeitsschutz gemäß ArbSchG sicherzustellen. In einer {industry} bestehen besondere Gefährdungen durch Maschinen und Holzstaub.",
  },

  {
    id: "arbstaettv",
    name: "Arbeitsstättenverordnung (ArbStättV)",
    officialReference: "ArbStättV §§ 3–8, Anhang",
    jurisdiction: "bund",
    category: "arbeitssicherheit",
    summary:
      "Die Arbeitsstättenverordnung regelt die Anforderungen an Arbeitsstätten einschließlich Beleuchtung, Belüftung, Notausgänge und Fluchtwegeplan. Für Tischlerei-Werkstätten gelten besondere Anforderungen an die Raumluftqualität wegen Holzstaub und Lösungsmitteldämpfen. Die Verordnung schreibt auch die Kennzeichnung von Rettungswegen und die Bereitstellung von Sanitäreinrichtungen vor.",
    keyRequirements: [
      "Notausgänge und Rettungswege kennzeichnen und freihalten",
      "Flucht- und Rettungsplan erstellen und aushängen",
      "Ausreichende Beleuchtung und Belüftung sicherstellen",
      "Sanitäreinrichtungen und Pausenräume bereitstellen",
      "Regelmäßige Prüfung der Arbeitsstätte auf Mängel",
    ],
    potentialPenalty: "Bußgeld bis 5.000 €",
    riskLevel: "hoch",
    sourceUrl: "https://www.gesetze-im-internet.de/arbst_ttv_2004/",
    appliesWhen: [
      { field: "workshopPresent", operator: "eq", value: true },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Da Sie eine Werkstatt betreiben, müssen die Anforderungen der Arbeitsstättenverordnung an Notausgänge, Belüftung und Raumgestaltung erfüllt werden.",
  },

  {
    id: "betrsichv",
    name: "Betriebssicherheitsverordnung (BetrSichV)",
    officialReference: "BetrSichV §§ 3–14",
    jurisdiction: "bund",
    category: "arbeitssicherheit",
    summary:
      "Die Betriebssicherheitsverordnung regelt die sichere Verwendung von Arbeitsmitteln und überwachungsbedürftigen Anlagen. In Tischlereien betrifft dies insbesondere Kreissägen, CNC-Fräsen, Hobelmaschinen und andere Holzbearbeitungsmaschinen. Die Verordnung schreibt regelmäßige Prüfungen und Gefährdungsbeurteilungen für alle Arbeitsmittel vor.",
    keyRequirements: [
      "Gefährdungsbeurteilung für alle Arbeitsmittel durchführen",
      "Regelmäßige Prüfung von Maschinen durch befähigte Personen",
      "Betriebsanweisungen für jede Maschine erstellen",
      "Instandhaltung und Wartung dokumentieren",
      "Nur Maschinen mit CE-Kennzeichnung verwenden",
    ],
    potentialPenalty: "Bußgeld bis 25.000 €, bei schweren Verstößen Freiheitsstrafe bis 1 Jahr",
    riskLevel: "hoch",
    sourceUrl: "https://www.gesetze-im-internet.de/betrsichv_2015/",
    appliesWhen: [
      { field: "workshopPresent", operator: "eq", value: true },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Als Betrieb mit Werkstatt sind Sie verpflichtet, alle Maschinen und Arbeitsmittel gemäß BetrSichV regelmäßig zu prüfen und sicher zu betreiben.",
  },

  {
    id: "dguv-vorschrift-1",
    name: "DGUV Vorschrift 1 — Grundsätze der Prävention",
    officialReference: "DGUV Vorschrift 1",
    jurisdiction: "branche",
    category: "arbeitssicherheit",
    summary:
      "Die DGUV Vorschrift 1 bildet die Grundlage des berufsgenossenschaftlichen Regelwerks und verpflichtet Unternehmer zur Verhütung von Arbeitsunfällen und Berufskrankheiten. Sie regelt die Bestellung von Sicherheitsbeauftragten, die Durchführung von Unterweisungen und die Bereitstellung von Erster Hilfe. Für Tischlereien als BG BAU-Mitgliedsbetriebe ist sie unmittelbar verbindlich.",
    keyRequirements: [
      "Sicherheitsbeauftragte bei mehr als 20 Beschäftigten bestellen",
      "Jährliche Unterweisung aller Beschäftigten dokumentieren",
      "Ersthelfer in ausreichender Zahl ausbilden lassen",
      "Arbeitsmedizinische Vorsorge organisieren",
      "Arbeitsunfälle der BG BAU melden (ab 3 Tagen Arbeitsunfähigkeit)",
    ],
    potentialPenalty: "Bußgeld bis 10.000 €, Erhöhung der BG-Beiträge",
    riskLevel: "hoch",
    sourceUrl: "https://www.dguv.de/de/praevention/vorschriften-regeln/index.jsp",
    appliesWhen: [
      { field: "employeeCount", operator: "gt", value: "0" },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Mit {employeeCount} Mitarbeitern in Ihrer {industry} unterliegen Sie den Präventionsvorschriften der DGUV. Jährliche Unterweisungen und Ersthelferschulungen sind Pflicht.",
  },

  {
    id: "dguv-regel-109-606",
    name: "DGUV Regel 109-606 — Branche Tischler-/Schreinerhandwerk",
    officialReference: "DGUV Regel 109-606",
    jurisdiction: "branche",
    category: "arbeitssicherheit",
    summary:
      "Die DGUV Regel 109-606 ist die branchenspezifische Sicherheitsregel für das Tischler- und Schreinerhandwerk. Sie konkretisiert die allgemeinen Arbeitsschutzvorschriften für typische Tätigkeiten in Holzwerkstätten und beschreibt Schutzmaßnahmen für den Umgang mit Holzbearbeitungsmaschinen, Oberflächenbehandlung und Holzstaub.",
    keyRequirements: [
      "Schutzeinrichtungen an Holzbearbeitungsmaschinen verwenden und regelmäßig prüfen",
      "Gehörschutz bei lärmintensiven Arbeiten (>85 dB) tragen",
      "Absaugeinrichtungen an stauberzeugenden Maschinen betreiben",
      "Sicherer Umgang mit Handmaschinen und Elektrowerkzeugen",
      "Branchenspezifische Gefährdungsbeurteilung erstellen",
    ],
    potentialPenalty: "Bußgeld bis 10.000 €, BG-Zuschlag bei Unfällen",
    riskLevel: "hoch",
    sourceUrl: "https://www.dguv.de/de/praevention/vorschriften-regeln/index.jsp",
    appliesWhen: [
      { field: "industry", operator: "in", value: ["tischlerei", "schreinerei"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Als {industry} gilt für Sie die branchenspezifische DGUV Regel 109-606, die Sicherheitsanforderungen speziell für das Tischler- und Schreinerhandwerk festlegt.",
  },

  {
    id: "trgs-553",
    name: "TRGS 553 — Holzstaub",
    officialReference: "TRGS 553",
    jurisdiction: "bund",
    category: "arbeitssicherheit",
    summary:
      "Die Technische Regel für Gefahrstoffe 553 regelt den Schutz der Beschäftigten vor der Exposition gegenüber Holzstaub. Holzstaub bestimmter Holzarten (z.B. Buche, Eiche) ist als krebserzeugend eingestuft. Die TRGS 553 schreibt Grenzwerte vor und fordert technische Schutzmaßnahmen wie Absauganlagen.",
    keyRequirements: [
      "Arbeitsplatzgrenzwert für Holzstaub einhalten (2 mg/m³ einatembare Fraktion)",
      "Absauganlage an allen stauberzeugenden Maschinen betreiben",
      "Regelmäßige Arbeitsplatzmessungen durchführen lassen",
      "Atemschutz bereitstellen, wenn technische Maßnahmen nicht ausreichen",
      "Expositionsverzeichnis für Beschäftigte bei Hartholzstaub führen",
    ],
    potentialPenalty: "Bußgeld bis 50.000 € (GefStoffV), Betriebsstilllegung bei akuter Gefährdung",
    riskLevel: "hoch",
    sourceUrl: "https://www.baua.de/DE/Angebote/Regelwerk/TRGS/TRGS-553.html",
    appliesWhen: [
      { field: "workshopPresent", operator: "eq", value: true },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Da in Ihrer Werkstatt Holzbearbeitung stattfindet, fällt zwangsläufig gesundheitsgefährdender Holzstaub an. Die TRGS 553 schreibt Absaugung, Grenzwerte und Schutzmaßnahmen vor.",
  },

  {
    id: "gefstoffv",
    name: "Gefahrstoffverordnung (GefStoffV)",
    officialReference: "GefStoffV §§ 6–15",
    jurisdiction: "bund",
    category: "arbeitssicherheit",
    summary:
      "Die Gefahrstoffverordnung regelt den Umgang mit gefährlichen Stoffen am Arbeitsplatz. In Tischlereien betrifft dies insbesondere Lacke, Beizen, Lösungsmittel, Klebstoffe und Holzschutzmittel. Die Verordnung verlangt ein Gefahrstoffverzeichnis, Betriebsanweisungen und die sichere Lagerung.",
    keyRequirements: [
      "Gefahrstoffverzeichnis führen und aktuell halten",
      "Sicherheitsdatenblätter für alle Gefahrstoffe vorhalten",
      "Betriebsanweisungen für den Umgang mit Gefahrstoffen erstellen",
      "Gefahrstoffe sachgerecht lagern (Gefahrstoffschrank, Auffangwannen)",
      "Substitutionsprüfung: weniger gefährliche Alternativen prüfen",
    ],
    potentialPenalty: "Bußgeld bis 50.000 €, bei Gefährdung Freiheitsstrafe bis 1 Jahr",
    riskLevel: "hoch",
    sourceUrl: "https://www.gesetze-im-internet.de/gefstoffv_2010/",
    appliesWhen: [
      { field: "hazardousStorage", operator: "eq", value: true },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Da Sie Lacke oder Lösungsmittel lagern, unterliegen Sie der Gefahrstoffverordnung. Sie müssen ein Gefahrstoffverzeichnis führen und sichere Lagerung gewährleisten.",
  },

  {
    id: "psa-bv",
    name: "PSA-Benutzungsverordnung (PSA-BV)",
    officialReference: "PSA-BV §§ 1–3",
    jurisdiction: "bund",
    category: "arbeitssicherheit",
    summary:
      "Die PSA-Benutzungsverordnung regelt die Bereitstellung und Benutzung persönlicher Schutzausrüstungen am Arbeitsplatz. In Tischlereien umfasst dies Gehörschutz, Schutzbrillen, Atemschutzmasken, Sicherheitsschuhe und Schutzhandschuhe. Der Arbeitgeber muss geeignete PSA auswählen, bereitstellen und deren Benutzung überwachen.",
    keyRequirements: [
      "PSA auf Grundlage der Gefährdungsbeurteilung auswählen",
      "PSA kostenlos an Beschäftigte ausgeben",
      "Unterweisung in der richtigen Benutzung der PSA",
      "Regelmäßige Prüfung und Austausch defekter PSA",
      "Tragepflicht durchsetzen und dokumentieren",
    ],
    potentialPenalty: "Bußgeld bis 5.000 €",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/psabv/",
    appliesWhen: [
      { field: "employeeCount", operator: "gt", value: "0" },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Mit Beschäftigten in Ihrer {industry} müssen Sie persönliche Schutzausrüstung (Gehörschutz, Schutzbrille, Atemschutz) bereitstellen und deren Verwendung sicherstellen.",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ARBEITSRECHT (~6 Vorschriften)
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: "milog",
    name: "Mindestlohngesetz (MiLoG)",
    officialReference: "MiLoG §§ 1–3, 20–21",
    jurisdiction: "bund",
    category: "arbeitsrecht",
    summary:
      "Das Mindestlohngesetz garantiert jedem Arbeitnehmer in Deutschland einen gesetzlichen Mindestlohn. Seit Januar 2024 beträgt dieser 12,41 € brutto pro Stunde. Arbeitgeber sind verpflichtet, die Arbeitszeiten zu dokumentieren und den Mindestlohn nachweislich zu zahlen.",
    keyRequirements: [
      "Gesetzlichen Mindestlohn (aktuell 12,41 €/Stunde) einhalten",
      "Arbeitszeitaufzeichnungen für alle Beschäftigten führen",
      "Aufzeichnungen mindestens 2 Jahre aufbewahren",
      "Auch bei Minijobs und Leiharbeitern den Mindestlohn sicherstellen",
    ],
    potentialPenalty: "Bußgeld bis 500.000 €",
    riskLevel: "hoch",
    sourceUrl: "https://www.gesetze-im-internet.de/milog/",
    appliesWhen: [
      { field: "employeeCount", operator: "gt", value: "0" },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Als Arbeitgeber mit {employeeCount} Beschäftigten müssen Sie den gesetzlichen Mindestlohn einhalten und die Arbeitszeiten dokumentieren.",
  },

  {
    id: "arbzg",
    name: "Arbeitszeitgesetz (ArbZG)",
    officialReference: "ArbZG §§ 3–7, 16",
    jurisdiction: "bund",
    category: "arbeitsrecht",
    summary:
      "Das Arbeitszeitgesetz begrenzt die werktägliche Arbeitszeit auf 8 Stunden, mit Verlängerung auf 10 Stunden bei Ausgleich innerhalb von 6 Monaten. Es regelt Ruhepausen, Ruhezeiten zwischen Arbeitstagen und das Verbot von Sonn- und Feiertagsarbeit. In Tischlereien mit saisonalen Auftragsspitzen ist die korrekte Arbeitszeiterfassung besonders wichtig.",
    keyRequirements: [
      "Tägliche Arbeitszeit von 8 Stunden (maximal 10 mit Ausgleich) einhalten",
      "Ruhepausen gewähren (30 Min. bei >6 Std., 45 Min. bei >9 Std.)",
      "Mindestruhezeit von 11 Stunden zwischen Arbeitstagen",
      "Arbeitszeitnachweise führen und 2 Jahre aufbewahren",
      "Sonn- und Feiertagsarbeit nur mit Genehmigung",
    ],
    potentialPenalty: "Bußgeld bis 15.000 €, bei Vorsatz bis 30.000 €",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/arbzg/",
    appliesWhen: [
      { field: "employeeCount", operator: "gt", value: "0" },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Mit {employeeCount} Beschäftigten gelten die Arbeitszeitvorschriften des ArbZG. Achten Sie besonders bei Auftragsspitzen auf die Einhaltung der Höchstarbeitszeiten.",
  },

  {
    id: "muschg",
    name: "Mutterschutzgesetz (MuSchG)",
    officialReference: "MuSchG §§ 1–16",
    jurisdiction: "bund",
    category: "arbeitsrecht",
    summary:
      "Das Mutterschutzgesetz schützt schwangere und stillende Arbeitnehmerinnen vor Gefahren am Arbeitsplatz. In Tischlereien bestehen besondere Beschäftigungsverbote wegen Holzstaub, Lärm, schwerer körperlicher Arbeit und Gefahrstoffen. Der Arbeitgeber muss eine anlassbezogene Gefährdungsbeurteilung für werdende Mütter durchführen.",
    keyRequirements: [
      "Gefährdungsbeurteilung für den Arbeitsplatz werdender Mütter erstellen",
      "Beschäftigungsverbote beachten (kein Umgang mit Gefahrstoffen, kein schweres Heben)",
      "Mutterschutzfristen einhalten (6 Wochen vor, 8 Wochen nach Geburt)",
      "Kündigungsschutz während Schwangerschaft und bis 4 Monate nach Entbindung",
      "Stillzeiten gewähren",
    ],
    potentialPenalty: "Bußgeld bis 30.000 €",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/muschg_2018/",
    appliesWhen: [
      { field: "employeeCount", operator: "gt", value: "0" },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Als Arbeitgeber müssen Sie jederzeit auf eine Schwangerschaft Ihrer Beschäftigten vorbereitet sein. In der {industry} bestehen besondere Beschäftigungsverbote wegen Holzstaub und Lärm.",
  },

  {
    id: "jarbschg",
    name: "Jugendarbeitsschutzgesetz (JArbSchG)",
    officialReference: "JArbSchG §§ 1–46",
    jurisdiction: "bund",
    category: "arbeitsrecht",
    summary:
      "Das Jugendarbeitsschutzgesetz schützt minderjährige Beschäftigte und Auszubildende (unter 18 Jahren). Es begrenzt Arbeitszeiten, verbietet gefährliche Arbeiten und schreibt ärztliche Untersuchungen vor. Für Tischlereien mit Lehrlingen gelten besondere Regelungen zum Umgang mit Maschinen und Gefahrstoffen.",
    keyRequirements: [
      "Arbeitszeit für Jugendliche auf 8 Std./Tag und 40 Std./Woche begrenzen",
      "Keine Akkordarbeit oder gefährlichen Arbeiten für Jugendliche",
      "Ärztliche Erstuntersuchung vor Ausbildungsbeginn",
      "Nachuntersuchung nach dem ersten Ausbildungsjahr",
      "Pausenregelungen einhalten (30 Min. bei >4,5 Std., 60 Min. bei >6 Std.)",
    ],
    potentialPenalty: "Bußgeld bis 15.000 €, bei Vorsatz Freiheitsstrafe bis 1 Jahr",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/jarbschg/",
    appliesWhen: [
      { field: "employeeTypes", operator: "in", value: ["lehrlinge"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Da Sie Lehrlinge beschäftigen, gelten die strengen Schutzvorschriften des Jugendarbeitsschutzgesetzes für minderjährige Auszubildende.",
  },

  {
    id: "bbig",
    name: "Berufsbildungsgesetz (BBiG)",
    officialReference: "BBiG §§ 1–26",
    jurisdiction: "bund",
    category: "arbeitsrecht",
    summary:
      "Das Berufsbildungsgesetz regelt die duale Berufsausbildung in Deutschland. Für Tischlereien mit Lehrlingen legt es die Pflichten des Ausbildungsbetriebs fest, einschließlich Ausbildungsplan, fachliche Anleitung durch den Meister und Freistellung für die Berufsschule.",
    keyRequirements: [
      "Schriftlichen Ausbildungsvertrag bei der Handwerkskammer registrieren",
      "Ausbildungsplan gemäß Ausbildungsordnung erstellen",
      "Ausbilder mit Meisterbrief oder gleichwertiger Qualifikation einsetzen",
      "Freistellung für Berufsschulunterricht gewähren",
      "Angemessene Ausbildungsvergütung zahlen",
    ],
    potentialPenalty: "Bußgeld bis 5.000 €, Entzug der Ausbildungsberechtigung",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/bbig_2005/",
    appliesWhen: [
      { field: "employeeTypes", operator: "in", value: ["lehrlinge"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Da Sie Lehrlinge ausbilden, müssen Sie die Vorschriften des Berufsbildungsgesetzes einhalten, insbesondere die ordnungsgemäße Ausbildungsplanerstellung und Registrierung bei der Handwerkskammer.",
  },

  {
    id: "nachwg",
    name: "Nachweisgesetz (NachwG)",
    officialReference: "NachwG §§ 1–4",
    jurisdiction: "bund",
    category: "arbeitsrecht",
    summary:
      "Das Nachweisgesetz verpflichtet Arbeitgeber, die wesentlichen Vertragsbedingungen schriftlich niederzulegen und dem Arbeitnehmer auszuhändigen. Seit der Neufassung 2022 müssen deutlich mehr Angaben gemacht werden, unter anderem zu Arbeitsort, Kündigungsfristen, Vergütungsbestandteilen und Überstundenregelungen.",
    keyRequirements: [
      "Wesentliche Arbeitsbedingungen schriftlich festhalten (am ersten Arbeitstag)",
      "Angaben zu Arbeitsort, Arbeitszeit, Vergütung, Urlaub, Kündigungsfristen",
      "Hinweis auf anwendbare Tarifverträge und Betriebsvereinbarungen",
      "Bei Änderungen: aktualisierte Niederschrift innerhalb eines Monats",
    ],
    potentialPenalty: "Bußgeld bis 2.000 € pro Verstoß",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/nachwg/",
    appliesWhen: [
      { field: "employeeCount", operator: "gt", value: "0" },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Mit {employeeCount} Beschäftigten sind Sie verpflichtet, jedem Mitarbeiter die wesentlichen Vertragsbedingungen schriftlich auszuhändigen.",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // GEWERBERECHT (~5 Vorschriften)
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: "hwo",
    name: "Handwerksordnung (HwO)",
    officialReference: "HwO §§ 1–7, Anlage A Nr. 27",
    jurisdiction: "bund",
    category: "gewerberecht",
    summary:
      "Die Handwerksordnung regelt die Ausübung des Handwerks in Deutschland. Das Tischlerhandwerk ist in Anlage A als zulassungspflichtiges Handwerk aufgeführt. Für den selbständigen Betrieb einer Tischlerei ist grundsätzlich die Eintragung in die Handwerksrolle mit Meisterbrief erforderlich.",
    keyRequirements: [
      "Eintragung in die Handwerksrolle bei der zuständigen Handwerkskammer",
      "Meisterbrief im Tischlerhandwerk (oder Ausnahmebewilligung nach § 8 HwO)",
      "Anzeige von Betriebsänderungen (Standort, Inhaber, Betriebsleiter)",
      "Mitgliedschaft und Beitragszahlung bei der Handwerkskammer",
    ],
    potentialPenalty: "Bußgeld bis 10.000 €, Betriebsuntersagung",
    riskLevel: "hoch",
    sourceUrl: "https://www.gesetze-im-internet.de/hwo/",
    appliesWhen: [
      { field: "industry", operator: "in", value: ["tischlerei", "schreinerei"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Als {industry} gehören Sie zum zulassungspflichtigen Handwerk nach Anlage A der HwO. Die Eintragung in die Handwerksrolle ist zwingend erforderlich.",
  },

  {
    id: "gewo",
    name: "Gewerbeordnung (GewO)",
    officialReference: "GewO §§ 14–15, 35",
    jurisdiction: "bund",
    category: "gewerberecht",
    summary:
      "Die Gewerbeordnung regelt die grundsätzlichen Anforderungen an den Betrieb eines Gewerbes in Deutschland. Jeder Gewerbebetrieb muss beim zuständigen Gewerbeamt angemeldet werden. Für Tischlereien gelten zusätzlich die Spezialregelungen der Handwerksordnung.",
    keyRequirements: [
      "Gewerbeanmeldung beim zuständigen Gewerbeamt",
      "Änderungen (Umzug, Erweiterung, Aufgabe) anzeigen",
      "Auskünfte an Behörden erteilen",
      "Gewerbesteuerliche Pflichten erfüllen",
    ],
    potentialPenalty: "Bußgeld bis 1.000 € bei unterlassener Anmeldung",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/gewo/",
    appliesWhen: [
      { field: "industry", operator: "in", value: ["tischlerei", "schreinerei"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Als gewerblicher Betrieb müssen Sie Ihre {industry} beim Gewerbeamt anmelden und Änderungen fristgerecht mitteilen.",
  },

  {
    id: "meisterpflicht",
    name: "Meisterpflicht im Tischlerhandwerk",
    officialReference: "HwO Anlage A Nr. 27, §§ 7–8",
    jurisdiction: "bund",
    category: "gewerberecht",
    summary:
      "Das Tischlerhandwerk unterliegt der Meisterpflicht. Nur Betriebe, die von einem Tischlermeister geführt oder betrieblich geleitet werden, dürfen in die Handwerksrolle eingetragen werden. Ausnahmen sind möglich bei gleichwertiger ausländischer Qualifikation oder nach § 7b HwO (Altgesellenregelung).",
    keyRequirements: [
      "Meisterbrief im Tischlerhandwerk nachweisen",
      "Betriebsleiter mit Meisterqualifikation benennen",
      "Bei Wegfall des Meisters: Stellvertreter innerhalb von 6 Monaten bestellen",
      "Alternativ: Ausnahmebewilligung nach § 8 HwO oder EU-Berufsqualifikation",
    ],
    potentialPenalty: "Bußgeld bis 10.000 €, Eintragungslöschung, Betriebsuntersagung",
    riskLevel: "hoch",
    sourceUrl: "https://www.gesetze-im-internet.de/hwo/__7.html",
    appliesWhen: [
      { field: "industry", operator: "in", value: ["tischlerei", "schreinerei"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Als {industry} unterliegen Sie der Meisterpflicht. Ohne Meisterbrief oder gleichwertige Qualifikation darf der Betrieb nicht selbständig geführt werden.",
  },

  {
    id: "handwerksrolle",
    name: "Handwerksrollenpflicht",
    officialReference: "HwO §§ 1, 6, 16",
    jurisdiction: "bund",
    category: "gewerberecht",
    summary:
      "Jeder zulassungspflichtige Handwerksbetrieb muss in die Handwerksrolle der zuständigen Handwerkskammer eingetragen sein. Die Eintragung ist Voraussetzung für den rechtmäßigen Betrieb einer Tischlerei. Ohne Eintragung liegt ein Verstoß gegen die Handwerksordnung vor.",
    keyRequirements: [
      "Antrag auf Eintragung bei der zuständigen Handwerkskammer stellen",
      "Meisterbrief oder gleichwertige Qualifikation nachweisen",
      "Eintragung vor Betriebsaufnahme abschließen",
      "Änderungen der Handwerkskammer mitteilen",
    ],
    potentialPenalty: "Bußgeld bis 10.000 €, Betriebsuntersagung durch Ordnungsbehörde",
    riskLevel: "hoch",
    sourceUrl: "https://www.gesetze-im-internet.de/hwo/__1.html",
    appliesWhen: [
      { field: "industry", operator: "in", value: ["tischlerei", "schreinerei"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Ihre {industry} ist ein zulassungspflichtiges Handwerk. Die Eintragung in die Handwerksrolle ist gesetzlich vorgeschrieben und muss vor Betriebsbeginn erfolgen.",
  },

  {
    id: "schwarzarbg",
    name: "Schwarzarbeitsbekämpfungsgesetz (SchwarzArbG)",
    officialReference: "SchwarzArbG §§ 1–11",
    jurisdiction: "bund",
    category: "gewerberecht",
    summary:
      "Das Schwarzarbeitsbekämpfungsgesetz richtet sich gegen illegale Beschäftigung und Schwarzarbeit. Für Tischlereien bedeutet dies insbesondere die Pflicht zur ordnungsgemäßen Anmeldung aller Beschäftigten, die Einhaltung der Sofortmeldepflicht bei der Sozialversicherung und die Dokumentation von Subunternehmerbeauftragungen.",
    keyRequirements: [
      "Sofortmeldung bei Beschäftigungsbeginn an die Deutsche Rentenversicherung",
      "Sozialversicherungsbeiträge korrekt abführen",
      "Mitführungspflicht von Ausweisdokumenten auf Baustellen",
      "Subunternehmer auf legale Beschäftigung prüfen",
      "Kooperation bei Kontrollen des Zolls (Finanzkontrolle Schwarzarbeit)",
    ],
    potentialPenalty: "Bußgeld bis 300.000 €, Freiheitsstrafe bis 3 Jahre bei schwerem Betrug",
    riskLevel: "hoch",
    sourceUrl: "https://www.gesetze-im-internet.de/schwarzarbg_2004/",
    appliesWhen: [
      { field: "employeeCount", operator: "gt", value: "0" },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Mit {employeeCount} Beschäftigten müssen Sie alle Mitarbeiter ordnungsgemäß anmelden und Sozialversicherungsbeiträge korrekt abführen. Bei Einsatz von Subunternehmern tragen Sie Mitverantwortung.",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // UMWELTRECHT (~5 Vorschriften)
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: "bimschg",
    name: "Bundes-Immissionsschutzgesetz (BImSchG)",
    officialReference: "BImSchG §§ 4–5, 22–25",
    jurisdiction: "bund",
    category: "umweltrecht",
    summary:
      "Das Bundes-Immissionsschutzgesetz schützt Menschen und Umwelt vor schädlichen Umwelteinwirkungen durch Luftverunreinigungen, Geräusche, Erschütterungen und ähnliche Vorgänge. Tischlereien mit Lackier- und Beschichtungsanlagen können genehmigungsbedürftig sein, wenn bestimmte Schwellenwerte für Lösungsmittelverbrauch überschritten werden.",
    keyRequirements: [
      "Prüfen, ob eine BImSchG-Genehmigung für Ihre Anlage erforderlich ist",
      "Emissionsgrenzwerte für Staub und VOC einhalten",
      "Lärm-Immissionsrichtwerte gegenüber Nachbarn einhalten",
      "Anlagenänderungen der Behörde anzeigen",
      "Bei genehmigungsbedürftigen Anlagen: regelmäßige Emissionsmessungen",
    ],
    potentialPenalty: "Bußgeld bis 50.000 €, Betriebsstilllegung, Freiheitsstrafe bis 5 Jahre bei schwerer Umweltverschmutzung",
    riskLevel: "hoch",
    sourceUrl: "https://www.gesetze-im-internet.de/bimschg/",
    appliesWhen: [
      { field: "paintingActivities", operator: "eq", value: true },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Da Sie regelmäßige Lackier- und Beschichtungsarbeiten durchführen, können Emissionsgrenzwerte des BImSchG auf Ihren Betrieb anwendbar sein. Prüfen Sie, ob eine Genehmigung erforderlich ist.",
  },

  {
    id: "krwg",
    name: "Kreislaufwirtschaftsgesetz (KrWG)",
    officialReference: "KrWG §§ 7–15, 47–49",
    jurisdiction: "bund",
    category: "umweltrecht",
    summary:
      "Das Kreislaufwirtschaftsgesetz regelt die Vermeidung, Verwertung und Beseitigung von Abfällen. Tischlereien erzeugen typischerweise Holzabfälle, Sägespäne, Lackreste und Verpackungsmaterialien. Diese Abfälle müssen getrennt gesammelt und ordnungsgemäß entsorgt werden.",
    keyRequirements: [
      "Abfälle getrennt sammeln und ordnungsgemäß entsorgen",
      "Nachweispflicht für gefährliche Abfälle (Lacke, Lösungsmittel) erfüllen",
      "Entsorgung über zugelassene Entsorger abwickeln",
      "Abfallbilanz führen (bei mehr als bestimmten Mengen)",
      "Vermeidung vor Verwertung vor Beseitigung (Abfallhierarchie)",
    ],
    potentialPenalty: "Bußgeld bis 100.000 €",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/krwg/",
    appliesWhen: [
      { field: "woodDustResidues", operator: "eq", value: true },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Da in Ihrem Betrieb Holzstaub und Lackrückstände anfallen, müssen Sie die Abfallentsorgung gemäß Kreislaufwirtschaftsgesetz ordnungsgemäß organisieren.",
  },

  {
    id: "verpackg",
    name: "Verpackungsgesetz (VerpackG)",
    officialReference: "VerpackG §§ 7–9, 33–34",
    jurisdiction: "bund",
    category: "umweltrecht",
    summary:
      "Das Verpackungsgesetz verpflichtet Hersteller und Vertreiber, die Verpackungen ihrer Produkte bei einem dualen System (z.B. Grüner Punkt) zu lizenzieren. Tischlereien, die Möbel oder andere Produkte verpackt an Endverbraucher liefern, gelten als Erstinverkehrbringer der Verpackung.",
    keyRequirements: [
      "Registrierung bei der Zentralen Stelle Verpackungsregister (LUCID)",
      "Systembeteiligungsvertrag mit dualem System abschließen",
      "Jährliche Mengenmeldung der in Verkehr gebrachten Verpackungen",
      "Vollständigkeitserklärung bei Überschreitung der Bagatellgrenzen",
    ],
    potentialPenalty: "Bußgeld bis 200.000 €, Vertriebsverbot",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/verpackg/",
    appliesWhen: [
      { field: "customerTypes", operator: "in", value: ["b2c", "beide"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Da Sie Produkte an Endverbraucher liefern, müssen Sie Ihre Verpackungen im LUCID-Register eintragen und bei einem dualen System lizenzieren.",
  },

  {
    id: "chemverbotsv",
    name: "Chemikalien-Verbotsverordnung (ChemVerbotsV)",
    officialReference: "ChemVerbotsV §§ 1–5",
    jurisdiction: "bund",
    category: "umweltrecht",
    summary:
      "Die Chemikalien-Verbotsverordnung beschränkt das Inverkehrbringen bestimmter gefährlicher Stoffe und Gemische. Für Tischlereien ist sie relevant bei der Verwendung und dem Verkauf von Holzschutzmitteln, bestimmten Lacken und Klebstoffen, die gefährliche Inhaltsstoffe enthalten können.",
    keyRequirements: [
      "Verbotene Stoffe und Zubereitungen nicht verwenden oder abgeben",
      "Sachkundenachweis bei Abgabe bestimmter Gefahrstoffe an Dritte",
      "Dokumentation der Abgabe gefährlicher Stoffe",
      "Informationspflicht gegenüber Kunden bei der Abgabe",
    ],
    potentialPenalty: "Bußgeld bis 50.000 €",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/chemverbotsv_2017/",
    appliesWhen: [
      { field: "hazardousStorage", operator: "eq", value: true },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Da Sie Lacke und Lösungsmittel lagern und verwenden, müssen Sie die Beschränkungen der Chemikalien-Verbotsverordnung beachten.",
  },

  {
    id: "eutr",
    name: "EU-Holzhandelsverordnung (EUTR)",
    officialReference: "Verordnung (EU) Nr. 995/2010",
    jurisdiction: "eu",
    category: "umweltrecht",
    summary:
      "Die EU-Holzhandelsverordnung (EU Timber Regulation) verbietet das Inverkehrbringen von illegal geschlagenem Holz im EU-Binnenmarkt. Marktteilnehmer, die Holz erstmals auf den EU-Markt bringen, müssen ein Sorgfaltspflichtssystem anwenden, um die Legalität des Holzes sicherzustellen. Für Tischlereien mit Holzimporten aus Nicht-EU-Ländern ist dies besonders relevant.",
    keyRequirements: [
      "Sorgfaltspflichtregelung (Due Diligence) für Holzeinkauf anwenden",
      "Herkunft und Legalität des Holzes dokumentieren",
      "Risikobewertung für Holzlieferungen durchführen",
      "Lieferantendokumentation mindestens 5 Jahre aufbewahren",
      "Bei geschützten Holzarten: CITES-Genehmigung einholen",
    ],
    potentialPenalty: "Bußgeld bis 50.000 €, Beschlagnahme der Ware",
    riskLevel: "hoch",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32010R0995",
    appliesWhen: [
      { field: "protectedWoodTypes", operator: "eq", value: true },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Da Sie geschützte Holzarten verwenden, müssen Sie die Herkunft und Legalität des Holzes nach EU-Holzhandelsverordnung nachweisen können.",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // PRODUKTSICHERHEIT (~4 Vorschriften)
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: "prodsg",
    name: "Produktsicherheitsgesetz (ProdSG)",
    officialReference: "ProdSG §§ 3–8",
    jurisdiction: "bund",
    category: "produktsicherheit",
    summary:
      "Das Produktsicherheitsgesetz stellt sicher, dass nur sichere Produkte auf dem Markt bereitgestellt werden. Tischlereien müssen gewährleisten, dass ihre Möbel, Treppen, Fenster und Türen den geltenden Sicherheitsanforderungen entsprechen. Bei Serienprodukten gelten zusätzliche Dokumentationspflichten.",
    keyRequirements: [
      "Nur sichere Produkte in Verkehr bringen",
      "Gebrauchs- und Warnhinweise in deutscher Sprache beifügen",
      "Technische Dokumentation erstellen und aufbewahren",
      "Bei Serienprodukten: Konformitätsbewertung durchführen",
      "Rückverfolgbarkeit der Produkte sicherstellen",
    ],
    potentialPenalty: "Bußgeld bis 100.000 €, Produktrückruf",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/prodsg_2021/",
    appliesWhen: [
      { field: "industry", operator: "in", value: ["tischlerei", "schreinerei"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Als Hersteller von {productTypes} sind Sie verpflichtet, nur sichere Produkte in Verkehr zu bringen und die Anforderungen des Produktsicherheitsgesetzes einzuhalten.",
  },

  {
    id: "prodhaftg",
    name: "Produkthaftungsgesetz (ProdHaftG)",
    officialReference: "ProdHaftG §§ 1–13",
    jurisdiction: "bund",
    category: "produktsicherheit",
    summary:
      "Das Produkthaftungsgesetz regelt die verschuldensunabhängige Haftung des Herstellers für Schäden durch fehlerhafte Produkte. Wenn ein Möbelstück, eine Treppe oder ein Fenster fehlerhaft ist und dadurch Personen- oder Sachschäden entstehen, haftet der Tischlereibetrieb als Hersteller. Eine Produkthaftpflichtversicherung ist daher dringend empfohlen.",
    keyRequirements: [
      "Fehlerfreie Produkte herstellen und Qualitätskontrolle durchführen",
      "Produktdokumentation (Materialien, Herstellungsdatum) aufbewahren",
      "Produkthaftpflichtversicherung abschließen",
      "Bei Fehlern: Rückrufverfahren einleiten",
      "Instruktionsfehler vermeiden: Montageanleitungen und Warnhinweise beifügen",
    ],
    potentialPenalty: "Unbegrenzte Schadensersatzpflicht, Personenschäden bis Haftungsgrenze 85 Mio. €",
    riskLevel: "hoch",
    sourceUrl: "https://www.gesetze-im-internet.de/prodhaftg/",
    appliesWhen: [
      { field: "industry", operator: "in", value: ["tischlerei", "schreinerei"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Als Hersteller von {productTypes} haften Sie verschuldensunabhängig für Schäden durch fehlerhafte Produkte. Eine Produkthaftpflichtversicherung wird dringend empfohlen.",
  },

  {
    id: "ce-kennzeichnung",
    name: "CE-Kennzeichnung / Bauproduktenverordnung",
    officialReference: "Verordnung (EU) Nr. 305/2011",
    jurisdiction: "eu",
    category: "produktsicherheit",
    summary:
      "Die EU-Bauproduktenverordnung verlangt die CE-Kennzeichnung für Bauprodukte, die unter eine harmonisierte europäische Norm (hEN) fallen. Für Tischlereien ist dies relevant bei der Herstellung von Fenstern, Türen und Treppen, die als Bauprodukte gelten und eine Leistungserklärung (DoP) benötigen.",
    keyRequirements: [
      "Prüfen, ob Ihre Produkte unter eine harmonisierte Norm fallen (z.B. EN 14351 für Fenster/Türen)",
      "Leistungserklärung (Declaration of Performance) erstellen",
      "CE-Kennzeichnung auf dem Produkt anbringen",
      "Werkseigene Produktionskontrolle (WPK) einrichten",
      "Erstprüfung durch notifizierte Stelle bei bestimmten Produkten",
    ],
    potentialPenalty: "Bußgeld bis 100.000 €, Vertriebsverbot, Rückruf",
    riskLevel: "hoch",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32011R0305",
    appliesWhen: [
      { field: "productTypes", operator: "in", value: ["fenster-tueren", "treppen"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Da Sie {productTypes} herstellen, die als Bauprodukte gelten, benötigen diese möglicherweise eine CE-Kennzeichnung nach der EU-Bauproduktenverordnung.",
  },

  {
    id: "din-normen-moebel",
    name: "DIN-Normen für Möbel und Holzprodukte",
    officialReference: "DIN 68871 (Möbel), DIN EN 16139 (Sitzmöbel), DIN EN 1335 (Bürostühle)",
    jurisdiction: "branche",
    category: "produktsicherheit",
    summary:
      "Für Möbel und Holzprodukte gelten verschiedene DIN- und EN-Normen, die Anforderungen an Sicherheit, Stabilität und Schadstoffbelastung definieren. Obwohl die Anwendung von DIN-Normen grundsätzlich freiwillig ist, können sie im Schadensfall als Maßstab für den Stand der Technik herangezogen werden.",
    keyRequirements: [
      "Relevante DIN-/EN-Normen für Ihre Produktkategorien kennen",
      "Standsicherheit und Belastbarkeit von Möbeln prüfen",
      "Schadstoffgrenzwerte (z.B. Formaldehyd) in Materialien einhalten",
      "Prüfberichte und Materialzertifikate aufbewahren",
    ],
    potentialPenalty: "Kein direktes Bußgeld, aber Haftungsrisiko im Schadensfall (Beweislastumkehr)",
    riskLevel: "niedrig",
    sourceUrl: "https://www.din.de",
    appliesWhen: [
      { field: "productTypes", operator: "in", value: ["moebel", "kuechen"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Als Hersteller von {productTypes} sollten Sie die relevanten DIN-Normen kennen und einhalten. Im Schadensfall gelten diese als Maßstab für den Stand der Technik.",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // DATENSCHUTZ (~3 Vorschriften)
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: "dsgvo",
    name: "Datenschutz-Grundverordnung (DSGVO)",
    officialReference: "Verordnung (EU) 2016/679",
    jurisdiction: "eu",
    category: "datenschutz",
    summary:
      "Die DSGVO regelt den Schutz personenbezogener Daten in der gesamten EU. Jeder Handwerksbetrieb, der Kundendaten, Mitarbeiterdaten oder Lieferantendaten verarbeitet, muss die Anforderungen der DSGVO erfüllen. Dies umfasst Informationspflichten, Einwilligungen, Datensicherheit und das Verzeichnis von Verarbeitungstätigkeiten.",
    keyRequirements: [
      "Verzeichnis von Verarbeitungstätigkeiten führen",
      "Datenschutzerklärung auf der Website bereitstellen",
      "Einwilligung vor Datenverarbeitung einholen (wo erforderlich)",
      "Technische und organisatorische Maßnahmen zum Datenschutz umsetzen",
      "Datenschutzbeauftragten bestellen (ab 20 Personen mit regelmäßiger Datenverarbeitung)",
    ],
    potentialPenalty: "Bußgeld bis 20 Mio. € oder 4 % des Jahresumsatzes",
    riskLevel: "hoch",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679",
    appliesWhen: [
      { field: "industry", operator: "in", value: ["tischlerei", "schreinerei"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Als Betrieb, der Kunden-, Mitarbeiter- und Lieferantendaten verarbeitet, unterliegen Sie der DSGVO. Dies gilt unabhängig von der Betriebsgröße.",
  },

  {
    id: "bdsg",
    name: "Bundesdatenschutzgesetz (BDSG)",
    officialReference: "BDSG §§ 1–46",
    jurisdiction: "bund",
    category: "datenschutz",
    summary:
      "Das Bundesdatenschutzgesetz ergänzt die DSGVO um nationale Regelungen. Für Handwerksbetriebe relevant sind insbesondere die Regelungen zum Beschäftigtendatenschutz (§ 26 BDSG), die Pflicht zur Bestellung eines Datenschutzbeauftragten und die Videoüberwachung von öffentlich zugänglichen Räumen.",
    keyRequirements: [
      "Beschäftigtendaten nur im erforderlichen Umfang verarbeiten (§ 26 BDSG)",
      "Datenschutzbeauftragten bestellen ab 20 Mitarbeitern mit regelmäßiger Datenverarbeitung",
      "Videoüberwachung nur mit Hinweisschild und Interessenabwägung",
      "Löschpflichten und Aufbewahrungsfristen einhalten",
    ],
    potentialPenalty: "Bußgeld bis 50.000 € (nationale Verstöße)",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/bdsg_2018/",
    appliesWhen: [
      { field: "employeeCount", operator: "gt", value: "0" },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Mit {employeeCount} Beschäftigten verarbeiten Sie Mitarbeiterdaten und unterliegen dem Beschäftigtendatenschutz nach BDSG § 26.",
  },

  {
    id: "ttdsg",
    name: "Telekommunikation-Telemedien-Datenschutz-Gesetz (TTDSG)",
    officialReference: "TTDSG §§ 1–26",
    jurisdiction: "bund",
    category: "datenschutz",
    summary:
      "Das TTDSG regelt den Datenschutz bei Telemedien und Telekommunikation. Für Tischlereien mit eigener Website oder Online-Shop ist es relevant wegen der Cookie-Einwilligung, des Impressumspflicht und der Anforderungen an die elektronische Kommunikation mit Kunden.",
    keyRequirements: [
      "Cookie-Einwilligung (Consent Banner) auf der Website einrichten",
      "Nur technisch notwendige Cookies ohne Einwilligung setzen",
      "Impressum mit vollständigen Angaben auf der Website bereitstellen",
      "Einwilligung für Tracking-Tools und Analyse-Dienste einholen",
    ],
    potentialPenalty: "Bußgeld bis 300.000 €",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/ttdsg/",
    appliesWhen: [
      { field: "onlineSales", operator: "eq", value: true },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Da Sie online verkaufen bzw. eine Website betreiben, müssen Sie die Cookie-Regelungen und Informationspflichten des TTDSG einhalten.",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // VERSICHERUNGSPFLICHTEN (~4 Vorschriften)
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: "bg-bau",
    name: "BG BAU — Pflichtmitgliedschaft Berufsgenossenschaft",
    officialReference: "SGB VII §§ 2, 150; Satzung BG BAU",
    jurisdiction: "bund",
    category: "versicherungspflichten",
    summary:
      "Jeder Tischlerei- und Schreinerbetrieb ist gesetzlich verpflichtet, Mitglied der BG BAU (Berufsgenossenschaft der Bauwirtschaft) zu sein. Die BG BAU ist der Träger der gesetzlichen Unfallversicherung für das Bau- und Holzgewerbe. Die Mitgliedschaft ist unabhängig von der Betriebsgröße und umfasst auch Soloselbständige.",
    keyRequirements: [
      "Betrieb bei der BG BAU anmelden (innerhalb einer Woche nach Betriebsgründung)",
      "Jährliche Entgeltmeldung (Lohnsummen) abgeben",
      "Beiträge fristgerecht zahlen",
      "Arbeitsunfälle und Berufskrankheiten der BG BAU melden",
      "Präventionsvorschriften der BG BAU einhalten",
    ],
    potentialPenalty: "Nacherhebung von Beiträgen, Zuschlag bis 100 % bei Nichtanmeldung, Regress bei Arbeitsunfällen",
    riskLevel: "hoch",
    sourceUrl: "https://www.bgbau.de",
    appliesWhen: [
      { field: "industry", operator: "in", value: ["tischlerei", "schreinerei"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Als {industry} sind Sie gesetzlich verpflichtet, Mitglied der BG BAU zu sein. Dies gilt auch für Soloselbständige ohne Mitarbeiter.",
  },

  {
    id: "betriebshaftpflicht",
    name: "Betriebshaftpflichtversicherung",
    officialReference: "BGB §§ 823–853 (Haftungsgrundlage)",
    jurisdiction: "bund",
    category: "versicherungspflichten",
    summary:
      "Obwohl keine gesetzliche Pflicht, ist die Betriebshaftpflichtversicherung für Tischlereien faktisch unverzichtbar. Sie deckt Personen-, Sach- und Vermögensschäden ab, die im Rahmen der betrieblichen Tätigkeit Dritten zugefügt werden. Ohne diese Versicherung können bereits einzelne Schadensfälle existenzbedrohend sein.",
    keyRequirements: [
      "Betriebshaftpflichtversicherung mit ausreichender Deckungssumme abschließen",
      "Deckung für Bearbeitungs- und Tätigkeitsschäden sicherstellen",
      "Montagerisiken (Arbeit beim Kunden) einschließen",
      "Deckungssumme regelmäßig überprüfen und anpassen",
    ],
    potentialPenalty: "Keine direkte Strafe, aber volle persönliche Haftung im Schadensfall (existenzbedrohend)",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/bgb/__823.html",
    appliesWhen: [
      { field: "industry", operator: "in", value: ["tischlerei", "schreinerei"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Als {industry} mit Kunden- und Montagetätigkeit ist eine Betriebshaftpflichtversicherung zwar nicht gesetzlich vorgeschrieben, aber faktisch unverzichtbar zum Schutz vor Schadenersatzansprüchen.",
  },

  {
    id: "berufshaftpflicht",
    name: "Berufshaftpflicht- und Produkthaftpflichtversicherung",
    officialReference: "ProdHaftG § 1 (Haftungsgrundlage)",
    jurisdiction: "bund",
    category: "versicherungspflichten",
    summary:
      "Die Produkthaftpflichtversicherung schützt Tischlereibetriebe vor Schadensersatzansprüchen aus der Produkthaftung. Da Tischlereien als Hersteller im Sinne des Produkthaftungsgesetzes gelten, haften sie verschuldensunabhängig für Schäden durch fehlerhafte Produkte. Besonders bei Treppen, Fenster und Küchen können Produktfehler zu erheblichen Schadenssummen führen.",
    keyRequirements: [
      "Produkthaftpflichtversicherung abschließen",
      "Deckungssumme an Produktrisiken anpassen",
      "Rückrufkostenversicherung prüfen",
      "Qualitätskontrolle und Dokumentation als präventive Maßnahme",
    ],
    potentialPenalty: "Keine direkte Strafe, aber verschuldensunabhängige Haftung bis 85 Mio. € (Personenschäden)",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/prodhaftg/",
    appliesWhen: [
      { field: "seriesProduction", operator: "eq", value: true },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Da Sie Serienprodukte herstellen, haften Sie verschuldensunabhängig nach dem Produkthaftungsgesetz. Eine Produkthaftpflichtversicherung ist dringend zu empfehlen.",
  },

  {
    id: "kfz-haftpflicht",
    name: "Kfz-Haftpflichtversicherung für Betriebsfahrzeuge",
    officialReference: "PflVG § 1, StVG § 7",
    jurisdiction: "bund",
    category: "versicherungspflichten",
    summary:
      "Die Kfz-Haftpflichtversicherung ist in Deutschland gesetzlich vorgeschrieben für jedes zugelassene Kraftfahrzeug. Tischlereien, die Lieferfahrzeuge, Transporter oder Montagefahrzeuge nutzen, müssen diese entsprechend versichern. Bei gewerblicher Nutzung gelten andere Tarife als bei privater Nutzung.",
    keyRequirements: [
      "Kfz-Haftpflichtversicherung für alle Betriebsfahrzeuge abschließen",
      "Gewerbliche Nutzung beim Versicherer anmelden",
      "Versicherungsbestätigung (eVB) für Zulassung vorweisen",
      "Insassenunfallversicherung für Mitfahrer prüfen",
    ],
    potentialPenalty: "Straftat (§ 6 PflVG): Geldstrafe oder Freiheitsstrafe bis 1 Jahr, Fahrzeugstilllegung",
    riskLevel: "niedrig",
    sourceUrl: "https://www.gesetze-im-internet.de/pflvg/",
    appliesWhen: [
      { field: "industry", operator: "in", value: ["tischlerei", "schreinerei"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Sofern Sie Betriebsfahrzeuge (Lieferwagen, Transporter) nutzen, ist die Kfz-Haftpflichtversicherung gesetzlich vorgeschrieben.",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ZUSÄTZLICHE — FERNABSATZ / ONLINE-HANDEL
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: "fernabsatzrecht",
    name: "Fernabsatzrecht (BGB §§ 312b–312h)",
    officialReference: "BGB §§ 312b–312h, Art. 246a EGBGB",
    jurisdiction: "bund",
    category: "produktsicherheit",
    summary:
      "Das Fernabsatzrecht im BGB regelt Verträge, die über Fernkommunikationsmittel (Online-Shop, Telefon, E-Mail) geschlossen werden. Tischlereien mit Online-Verkauf müssen umfangreiche Informationspflichten erfüllen und ein Widerrufsrecht gewähren. Sonderregelungen gelten für Maßanfertigungen.",
    keyRequirements: [
      "Verbraucher vor Vertragsschluss über wesentliche Eigenschaften, Preis und Widerrufsrecht informieren",
      "Widerrufsbelehrung und Muster-Widerrufsformular bereitstellen",
      "14-tägiges Widerrufsrecht gewähren (Ausnahme: individuell angefertigte Waren)",
      "AGB klar und verständlich darstellen",
      "Bestellbestätigung unverzüglich per E-Mail versenden",
    ],
    potentialPenalty: "Abmahnung (Kosten ca. 1.000–5.000 €), Bußgeld bis 50.000 €, erweitertes Widerrufsrecht (12 Monate)",
    riskLevel: "mittel",
    sourceUrl: "https://www.gesetze-im-internet.de/bgb/__312b.html",
    appliesWhen: [
      { field: "onlineSales", operator: "eq", value: true },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Da Sie online verkaufen, müssen Sie die Fernabsatzvorschriften einhalten, insbesondere Widerrufsrecht und Informationspflichten gegenüber Verbrauchern.",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ZUSÄTZLICHE — IMPORT / ZOLL
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: "eori-zollrecht",
    name: "EORI-Registrierung und Zollpflichten",
    officialReference: "Unionszollkodex (UZK) Art. 9, Durchführungsverordnung (EU) 2015/2447",
    jurisdiction: "eu",
    category: "gewerberecht",
    summary:
      "Unternehmen, die Waren aus Nicht-EU-Ländern importieren, benötigen eine EORI-Nummer (Economic Operators Registration and Identification). Diese ist Voraussetzung für alle Zollvorgänge. Tischlereien, die Holz oder Materialien aus Nicht-EU-Staaten beziehen, müssen sich registrieren und die Einfuhrbestimmungen beachten.",
    keyRequirements: [
      "EORI-Nummer beim zuständigen Hauptzollamt beantragen",
      "Zollanmeldung für alle Nicht-EU-Importe abgeben",
      "Einfuhrumsatzsteuer und Zölle entrichten",
      "Warensendungen korrekt deklarieren (Warennummer, Ursprungsland)",
      "Einfuhrbelege mindestens 10 Jahre aufbewahren",
    ],
    potentialPenalty: "Bußgeld bis 5.000 €, Warenbeschlagnahme, Strafverfahren bei Zollhinterziehung",
    riskLevel: "mittel",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32013R0952",
    appliesWhen: [
      { field: "materialSources", operator: "in", value: ["nicht-eu"] },
    ],
    niche: "carpentry",
    whyAppliesTemplate:
      "Da Sie Materialien aus Nicht-EU-Ländern beziehen, benötigen Sie eine EORI-Nummer und müssen die zollrechtlichen Einfuhrbestimmungen beachten.",
  },
];
