import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Trash2 } from 'lucide-react'

interface WhitelistEntry {
  address: string
  hasCompleted: boolean
  completedAt?: string
}

interface AddressTableProps {
  addresses: WhitelistEntry[]
  onRemoveAddress: (address: string) => void
  isRemoving: boolean
}

export function AddressTable({ addresses, onRemoveAddress, isRemoving }: AddressTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Address</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Completed At</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {addresses.map((entry) => (
            <TableRow key={entry.address}>
              <TableCell className="font-mono text-sm">
                {entry.address}
              </TableCell>
              <TableCell>
                {entry.hasCompleted ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {entry.completedAt 
                  ? new Date(entry.completedAt).toLocaleDateString()
                  : '-'
                }
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveAddress(entry.address)}
                  disabled={isRemoving}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}