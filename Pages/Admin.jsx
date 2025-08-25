import React, { useState, useEffect } from 'react';
import { Withdrawal } from '@/entities/Withdrawal';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPage() {
    const [withdrawals, setWithdrawals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const fetchWithdrawals = async () => {
            setIsLoading(true);
            try {
                const data = await Withdrawal.list('-created_date');
                setWithdrawals(data);
            } catch (error) {
                console.error("Failed to fetch withdrawals:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchWithdrawals();
    }, []);

    const downloadCSV = () => {
        setIsDownloading(true);
        const headers = ['Username', 'User ID', 'Amount', 'Date'];
        const rows = withdrawals.map(w => [
            w.robloxUsername,
            w.robloxUserId,
            w.amount,
            format(new Date(w.created_date), 'yyyy-MM-dd HH:mm:ss')
        ]);

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "withdrawals.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsDownloading(false);
    };

    return (
        <div className="container mx-auto p-4 md:p-8 text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Withdrawal Requests</h1>
                <Button onClick={downloadCSV} disabled={isDownloading || withdrawals.length === 0}>
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download CSV
                </Button>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b-gray-700 hover:bg-gray-800">
                            <TableHead className="text-white">Roblox Username</TableHead>
                            <TableHead className="text-white">Amount</TableHead>
                            <TableHead className="text-white">Date</TableHead>
                            <TableHead className="text-white">User ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan="4" className="text-center py-8">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-400" />
                                </TableCell>
                            </TableRow>
                        ) : withdrawals.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan="4" className="text-center py-8 text-gray-400">
                                    No withdrawal requests yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            withdrawals.map((w) => (
                                <TableRow key={w.id} className="border-b-gray-700/50 hover:bg-gray-800/70">
                                    <TableCell className="font-medium">{w.robloxUsername}</TableCell>
                                    <TableCell>{w.amount.toFixed(1)}</TableCell>
                                    <TableCell>{format(new Date(w.created_date), 'PPpp')}</TableCell>
                                    <TableCell className="text-gray-400">{w.robloxUserId}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
