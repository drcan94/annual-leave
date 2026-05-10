import { CalendarAppShell } from "@/components/calendar-app-shell";
import { CalendarWorkspace } from "@/components/calendar-workspace/CalendarWorkspace";

export default function Home() {
  return (
    <CalendarAppShell>
      <CalendarWorkspace />
    </CalendarAppShell>
  );
}
