import { AnimatePresence } from "framer-motion";
import { ErrorScreen } from "./components/ErrorScreen";
import { GraphScreen } from "./components/GraphScreen";
import { InputScreen } from "./components/InputScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { useCodeAtlas } from "./hooks/useCodeAtlas";

export default function App() {
  const atlas = useCodeAtlas();

  return (
    <AnimatePresence mode="wait">
      {atlas.phase === "input" && <InputScreen key="input" atlas={atlas} />}
      {atlas.phase === "loading" && <LoadingScreen key="loading" atlas={atlas} />}
      {atlas.phase === "graph" && <GraphScreen key="graph" atlas={atlas} />}
      {atlas.phase === "error" && <ErrorScreen key="error" atlas={atlas} />}
    </AnimatePresence>
  );
}

