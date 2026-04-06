// Team definitions — slug must match what's stored in Google Sheet "Team" column
export const TEAMS = [
  { id: "agao-ao",          name: "Agao-ao" },
  { id: "agrupacion",       name: "Agrupacion" },
  { id: "san-rafael",       name: "San Rafael" },
  { id: "banga-caves",      name: "Banga Caves" },
  { id: "cabugao",          name: "Cabugao" },
  { id: "cabadisan",        name: "Cabadisan" },
  { id: "binahan-proper",   name: "Binahan Proper" },
  { id: "poblacion-iraya",  name: "Poblacion Iraya" },
  { id: "buenasuerte",      name: "Buenasuerte" },
  { id: "inandawa",         name: "Inandawa" },
  { id: "lower-omon",       name: "Lower Omon" },
  { id: "lower-santa-cruz", name: "Lower Santa Cruz" },
  { id: "patalunan",        name: "Patalunan" },
  { id: "panaytayan-nuevo",  name: "Panaytayan Nuevo" },
  { id: "catabangan-proper", name: "Catabangan Proper" },
];

export const TEAM_COLORS = {
  "agao-ao":          "#4f8ef7",
  "agrupacion":       "#f7874f",
  "san-rafael":       "#4fc97f",
  "banga-caves":      "#c94f8e",
  "cabugao":          "#e6b800",
  "cabadisan":        "#4fc9c9",
  "binahan-proper":   "#8e4fc9",
  "poblacion-iraya":  "#b5c94f",
  "buenasuerte":      "#4f7fc9",
  "inandawa":         "#c94f4f",
  "lower-omon":       "#4fc94f",
  "lower-santa-cruz": "#c97f4f",
  "patalunan":        "#7f4fc9",
  "panaytayan-nuevo":  "#4fb8c9",
  "catabangan-proper": "#f76f8e",
};

export function getTeamColor(teamId) {
  return TEAM_COLORS[teamId] || "#8892b0";
}

export function getTeamName(teamId) {
  const team = TEAMS.find((t) => t.id === teamId);
  return team ? team.name : teamId;
}

// Always fixed — matches GAS EVENT_TITLE
export const EVENT_TITLE = "PuroKalusugan";

export const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const DAYS_OF_WEEK = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
