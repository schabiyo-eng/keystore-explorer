import { AppShell } from "./shell/AppShell";
import { loadFeatures } from "./shell/loadFeatures";

loadFeatures();

export default function App() {
  return <AppShell />;
}
