// Búsqueda del directorio: sin importar acentos ni mayúsculas, sobre nombre, categoría,
// servicios, descripción y dirección, con sinónimos para lo que la gente escribe de verdad
// ("comida" → restaurantes, "doctor" → clínicas).

export function normalizeText(text: string | null | undefined): string {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Cada grupo: palabras que el usuario puede escribir → términos que buscamos en los datos
const SYNONYMS: [string[], string[]][] = [
  [["comida", "comer", "almuerzo", "desayuno", "cena", "restaurante", "restaurantes", "comedor"], ["restaurante", "comida", "cafeteria", "pizza", "pollo", "baleada"]],
  [["cafe", "cafeteria", "postre", "postres", "reposteria", "pastel", "pasteles"], ["cafe", "cafeteria", "reposteria", "postre", "pastel"]],
  [["doctor", "doctora", "medico", "medica", "clinica", "hospital", "salud", "consulta"], ["clinica", "salud", "medico", "doctor", "consulta"]],
  [["farmacia", "medicina", "medicinas", "medicamento", "medicamentos", "botica"], ["farmacia", "medicina", "medicamento"]],
  [["dentista", "odontologo", "odontologia", "muela", "dientes"], ["dental", "odontolog", "dentista"]],
  [["hotel", "hospedaje", "dormir", "habitacion", "alojamiento", "posada"], ["hotel", "hospedaje", "habitacion", "alojamiento"]],
  [["taxi", "transporte", "bus", "buses", "rapidito", "viaje"], ["transporte", "taxi", "bus", "ruta"]],
  [["mecanico", "taller", "carro", "moto", "repuesto", "repuestos", "llantas", "llanta"], ["taller", "repuesto", "mecanic", "llanta", "lubric"]],
  [["ferreteria", "materiales", "construccion", "cemento", "herramienta", "herramientas"], ["ferreteria", "construccion", "material", "herramienta"]],
  [["pelo", "corte", "barberia", "barbero", "salon", "unas", "belleza", "maquillaje"], ["belleza", "barberia", "salon", "estetica", "unas"]],
  [["ropa", "zapatos", "calzado", "tienda de ropa", "boutique"], ["ropa", "calzado", "boutique", "zapat"]],
  [["super", "supermercado", "mercado", "abarroteria", "pulperia", "despensa"], ["supermercado", "pulperia", "tienda", "abarrot"]],
  [["envio", "envios", "paquete", "encomienda", "mensajeria", "delivery"], ["envio", "mensajeria", "encomienda", "delivery"]],
  [["escuela", "colegio", "clases", "curso", "cursos", "educacion", "universidad", "ingles"], ["educacion", "escuela", "colegio", "curso", "academia"]],
  [["gimnasio", "gym", "ejercicio", "deporte", "deportes"], ["gimnasio", "gym", "deporte", "fitness"]],
  [["fiesta", "evento", "eventos", "catering", "decoracion", "salon de eventos"], ["evento", "catering", "decoracion", "fiesta"]],
  [["imprenta", "impresion", "rotulos", "diseno", "banner", "sublimacion"], ["imprenta", "impresion", "diseno", "rotulo", "sublimacion"]],
  [["abogado", "notario", "contador", "contabilidad", "legal"], ["abogad", "notari", "contab", "legal"]],
  [["internet", "cable", "wifi", "telefonia"], ["internet", "cable", "telecomunicacion", "wifi"]],
  [["joyeria", "joyas", "aretes", "pulsera", "pulseras", "collar", "collares", "anillo", "anillos", "reloj", "relojes", "bisuteria"], ["joyeria", "joya", "arete", "pulsera", "collar", "anillo", "bisuteria", "accesorio"]],
  [["flores", "floristeria", "regalo", "regalos", "globos", "arreglo", "arreglos", "detalle", "detalles", "sorpresa"], ["flores", "floristeria", "rosas", "regalo", "globo", "arreglo", "detalle", "sorpresa"]],
  [["amazon", "shein", "encargo", "encargos", "usa", "estados unidos", "temu"], ["encargo", "amazon", "shein", "estados unidos", "tiendas de usa"]],
  [["lavanderia", "lavar ropa", "limpieza", "aseo"], ["lavanderia", "limpieza", "lavado"]],
  [["muebles", "mueble", "electrodomesticos", "refrigeradora", "lavadora", "cocina", "ropero"], ["mueble", "electrodomestico", "hogar", "ropero", "cocina"]],
  [["carne", "carnes", "pollo", "carniceria", "polleria", "embutidos"], ["carne", "pollo", "carniceria", "polleria", "embutido"]],
  [["panaderia", "pan", "pasteles", "pastel", "reposteria"], ["panaderia", "reposteria", "pastel", "postre"]],
];

// wholeWord: la forma en singular solo cuenta como palabra completa ("flor"/"flores"),
// no como inicio de otra ("Florenze")
export type QueryTerm = { term: string; weight: number; wholeWord?: boolean };

// Una coincidencia por sinónimo vale menos que la palabra que escribió el usuario
const SYNONYM_WEIGHT = 0.6;

export function expandQuery(query: string): QueryTerm[][] {
  const words = normalizeText(query).split(" ").filter((w) => w.length > 1);
  // Cada palabra de la búsqueda debe coincidir con al menos una de sus variantes
  return words.map((word) => {
    const variants = new Map<string, number>([[word, 1]]);
    // "ferreterias" → "ferreteria", "flores" → "flor"
    const singular = word.length > 4 && word.endsWith("s") ? word.replace(/(?<=[rlndzj])es$|s$/, "") : null;
    if (singular) variants.set(singular, 1);
    for (const [triggers, terms] of SYNONYMS) {
      if (triggers.some((t) => t === word || (word.length > 4 && t.startsWith(word)))) {
        for (const t of terms) if (!variants.has(t)) variants.set(t, SYNONYM_WEIGHT);
      }
    }
    return [...variants].map(([term, weight]) => ({ term, weight, wholeWord: term === singular }));
  });
}

export type Searchable = {
  name: string;
  description?: string | null;
  address?: string | null;
  services?: unknown;
  categoryName?: string | null;
};

// 0 = no coincide. Más alto = más relevante (el nombre pesa más que la descripción).
export function scoreMatch(item: Searchable, groups: QueryTerm[][]): number {
  if (groups.length === 0) return 0;
  const name = normalizeText(item.name);
  const category = normalizeText(item.categoryName);
  const services = normalizeText(Array.isArray(item.services) ? item.services.join(" ") : "");
  const description = normalizeText(item.description);
  const address = normalizeText(item.address);

  let total = 0;
  for (const variants of groups) {
    let best = 0;
    for (const { term: v, weight, wholeWord } of variants) {
      const has = wholeWord
        ? (text: string) => new RegExp(`(^| )${v}(es|s)?( |$)`).test(text)
        : (text: string) => text.includes(v);
      let points = 0;
      if (has(name)) points = name.startsWith(v) ? 12 : 10;
      else if (has(category)) points = 9;
      else if (has(services)) points = 5;
      else if (has(description)) points = 3;
      else if (has(address)) points = 2;
      best = Math.max(best, points * weight);
    }
    if (best === 0) return 0;
    total += best;
  }
  return total;
}
