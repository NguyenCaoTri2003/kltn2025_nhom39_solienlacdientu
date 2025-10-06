import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Student } from "@packages/core/entities/Student";

export function StudentTable({ students }: { students: Student[] }) {
  if (!students || students.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6">
        Chưa có sinh viên.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã SV</TableHead>
          <TableHead>Họ và tên</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phụ huynh</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {students.map((s) => {
          const parents = s.student_parent?.map((sp) => ({
            name: sp.parents?.users?.full_name,
            phone: sp.parents?.users?.phone,
            relation: sp.relationship,
          })) ?? [];

          return (
            <TableRow key={s.id}>
              <TableCell>{s.student_code}</TableCell>
              <TableCell>{s.users?.full_name}</TableCell>
              <TableCell>{s.users?.email || "-"}</TableCell>
              <TableCell>
                {parents.length > 0 ? (
                  <div className="space-y-1">
                    {parents.map((p, i) => (
                      <div key={i} className="text-sm leading-tight">
                        <span className="font-medium text-foreground">
                          {p.relation === "father"
                            ? "Cha"
                            : "Mẹ"}{": "}
                        </span>
                        <span>{p.name}</span>
                        {p.phone && (
                          <span className="text-muted-foreground"> ({p.phone})</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Không có</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
