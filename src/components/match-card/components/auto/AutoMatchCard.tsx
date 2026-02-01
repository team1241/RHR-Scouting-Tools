import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AllianceTeam = {
  number: number;
  name: string;
};

type AutoMatchCardProps = {
  redAlliance: AllianceTeam[];
  blueAlliance: AllianceTeam[];
};

const MATCH_CARD_CATEGORIES = [
  "Category 1",
  "Category 2",
  "Category 3",
  "Category 4",
  "Category 5",
  "Category 6",
  "Category 7",
  "Category 8",
  "Category 9",
  "Category 10",
  "Category 11",
  "Category 12",
  "Category 13",
  "Category 14",
  "Category 15",
  "Category 16",
];

export default function AutoMatchCard({
  redAlliance,
  blueAlliance,
}: AutoMatchCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/70">
      <Table className="text-slate-700">
        <TableHeader className="text-sm uppercase text-center">
          <TableRow>
            {redAlliance.map((team) => (
              <TableHead
                key={`red-head-${team.number}`}
                className="bg-red-50 text-center text-red-700 first:rounded-tl-lg"
              >
                {team.number}
              </TableHead>
            ))}
            <TableHead className="bg-red-100 text-center text-red-700">
              Total
            </TableHead>
            <TableHead colSpan={2} aria-hidden className="text-center" />
            <TableHead className="bg-blue-100 text-center text-blue-700">
              Total
            </TableHead>
            {blueAlliance.map((team) => (
              <TableHead
                key={`blue-head-${team.number}`}
                className="bg-blue-50 text-center text-blue-700 last:rounded-tr-lg"
              >
                {team.number}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {MATCH_CARD_CATEGORIES.map((category) => (
            <TableRow key={category} className="h-10">
              {redAlliance.map((team) => (
                <TableCell
                  key={`red-${team.number}-${category}`}
                  className="text-center"
                >
                  0
                </TableCell>
              ))}
              <TableCell className="text-center">0</TableCell>
              <TableCell
                colSpan={2}
                className="text-center font-medium text-slate-900"
              >
                {category}
              </TableCell>
              <TableCell className="text-center">0</TableCell>
              {blueAlliance.map((team) => (
                <TableCell
                  key={`blue-${team.number}-${category}`}
                  className="text-center"
                >
                  0
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
