// Íconos de categoría (columna `icon` de la tabla categories). Compartido por /categorias y el home.
import {
  FaTools, FaUtensils, FaPills, FaHospital, FaPaw, FaShoppingCart, FaStore,
  FaCar, FaBolt, FaFaucet, FaHardHat, FaBook, FaPen, FaMobile, FaWifi,
  FaPrint, FaTshirt, FaCut, FaBed, FaTaxi, FaTruck, FaWallet, FaHome,
  FaCalendar, FaDumbbell, FaMusic, FaChurch, FaBriefcase, FaBuilding,
  FaBirthdayCake, FaGem, FaGift, FaBoxOpen, FaSoap, FaCouch, FaDrumstickBite,
} from "react-icons/fa";
import type { JSX } from "react";

export type IconDef = { el: JSX.Element; accent: string; bg: string };

export const iconMap: Record<string, IconDef> = {
  tools:          { el: <FaTools size={17} />,        accent: "rgb(124,58,237)",  bg: "rgba(124,58,237,0.08)"  },
  utensils:       { el: <FaUtensils size={17} />,     accent: "rgb(234,88,12)",   bg: "rgba(234,88,12,0.08)"   },
  pills:          { el: <FaPills size={17} />,        accent: "rgb(37,99,235)",   bg: "rgba(37,99,235,0.08)"   },
  hospital:       { el: <FaHospital size={17} />,     accent: "rgb(220,38,38)",   bg: "rgba(220,38,38,0.08)"   },
  paw:            { el: <FaPaw size={17} />,          accent: "rgb(147,51,234)",  bg: "rgba(147,51,234,0.08)"  },
  "shopping-cart":{ el: <FaShoppingCart size={17} />, accent: "rgb(202,138,4)",   bg: "rgba(202,138,4,0.08)"   },
  store:          { el: <FaStore size={17} />,        accent: "rgb(15,118,110)",  bg: "rgba(15,118,110,0.08)"  },
  car:            { el: <FaCar size={17} />,          accent: "rgb(185,28,28)",   bg: "rgba(185,28,28,0.08)"   },
  bolt:           { el: <FaBolt size={17} />,         accent: "rgb(161,98,7)",    bg: "rgba(161,98,7,0.08)"    },
  faucet:         { el: <FaFaucet size={17} />,       accent: "rgb(29,78,216)",   bg: "rgba(29,78,216,0.08)"   },
  "hard-hat":     { el: <FaHardHat size={17} />,      accent: "rgb(194,65,12)",   bg: "rgba(194,65,12,0.08)"   },
  book:           { el: <FaBook size={17} />,         accent: "rgb(67,56,202)",   bg: "rgba(67,56,202,0.08)"   },
  pen:            { el: <FaPen size={17} />,          accent: "rgb(190,18,60)",   bg: "rgba(190,18,60,0.08)"   },
  mobile:         { el: <FaMobile size={17} />,       accent: "rgb(109,40,217)",  bg: "rgba(109,40,217,0.08)"  },
  wifi:           { el: <FaWifi size={17} />,         accent: "rgb(7,89,133)",    bg: "rgba(7,89,133,0.08)"    },
  print:          { el: <FaPrint size={17} />,        accent: "rgb(75,85,99)",    bg: "rgba(75,85,99,0.08)"    },
  tshirt:         { el: <FaTshirt size={17} />,       accent: "rgb(157,23,77)",   bg: "rgba(157,23,77,0.08)"   },
  scissors:       { el: <FaCut size={17} />,          accent: "rgb(180,27,27)",   bg: "rgba(180,27,27,0.08)"   },
  bed:            { el: <FaBed size={17} />,          accent: "rgb(29,78,216)",   bg: "rgba(29,78,216,0.08)"   },
  taxi:           { el: <FaTaxi size={17} />,         accent: "rgb(161,98,7)",    bg: "rgba(161,98,7,0.08)"    },
  truck:          { el: <FaTruck size={17} />,        accent: "rgb(21,128,61)",   bg: "rgba(21,128,61,0.08)"   },
  wallet:         { el: <FaWallet size={17} />,       accent: "rgb(67,56,202)",   bg: "rgba(67,56,202,0.08)"   },
  home:           { el: <FaHome size={17} />,         accent: "rgb(21,128,61)",   bg: "rgba(21,128,61,0.08)"   },
  calendar:       { el: <FaCalendar size={17} />,     accent: "rgb(194,65,12)",   bg: "rgba(194,65,12,0.08)"   },
  dumbbell:       { el: <FaDumbbell size={17} />,     accent: "rgb(185,28,28)",   bg: "rgba(185,28,28,0.08)"   },
  music:          { el: <FaMusic size={17} />,        accent: "rgb(109,40,217)",  bg: "rgba(109,40,217,0.08)"  },
  church:         { el: <FaChurch size={17} />,       accent: "rgb(75,85,99)",    bg: "rgba(75,85,99,0.08)"    },
  briefcase:      { el: <FaBriefcase size={17} />,    accent: "rgb(55,65,81)",    bg: "rgba(55,65,81,0.08)"    },
  building:       { el: <FaBuilding size={17} />,     accent: "rgb(55,65,81)",    bg: "rgba(55,65,81,0.08)"    },
  cake:           { el: <FaBirthdayCake size={17} />, accent: "rgb(190,24,93)",   bg: "rgba(190,24,93,0.08)"   },
  gem:            { el: <FaGem size={17} />,          accent: "rgb(124,58,237)",  bg: "rgba(124,58,237,0.08)"  },
  gift:           { el: <FaGift size={17} />,         accent: "rgb(219,39,119)",  bg: "rgba(219,39,119,0.08)"  },
  box:            { el: <FaBoxOpen size={17} />,      accent: "rgb(29,78,216)",   bg: "rgba(29,78,216,0.08)"   },
  soap:           { el: <FaSoap size={17} />,         accent: "rgb(14,116,144)",  bg: "rgba(14,116,144,0.08)"  },
  couch:          { el: <FaCouch size={17} />,        accent: "rgb(146,64,14)",   bg: "rgba(146,64,14,0.08)"   },
  drumstick:      { el: <FaDrumstickBite size={17} />,accent: "rgb(185,28,28)",   bg: "rgba(185,28,28,0.08)"   },
};

export function categoryIcon(icon?: string | null): IconDef {
  return (icon && iconMap[icon]) || iconMap.building;
}
