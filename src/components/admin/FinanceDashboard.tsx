'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button, buttonVariants } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Landmark, TrendingUp, Trash2, Plus, AlertTriangle, Save, Building, Wrench, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Loader } from '@/components/ui/loader';

const expenseSchema = z.object({
    description: z.string().min(1, 'Description is required.'),
    amount: z.coerce.number().min(0.01, 'Amount must be positive.'),
    category: z.string().min(1, 'Category is required.'),
    expenseType: z.enum(['capital', 'operational'], { required_error: 'You must select an expense type.' }),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const expenseCategories = ['Chicks', 'Feed', 'Vaccines', 'Utilities', 'Packaging', 'Marketing', 'Transport', 'Coop Construction', 'Equipment', 'Other'];

export default function FinanceDashboard() {
    const { 
        financials,
        expenses,
        prices,
        setPrices,
        addExpense,
        deleteExpense,
        saveAllSettings, 
        isLoading, 
        isSaving 
    } = useAdmin();
    const isMobile = useIsMobile();
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            description: '',
            amount: 0,
            category: '',
            expenseType: 'operational',
        }
    });

    const handleAddExpense = async (values: ExpenseFormValues) => {
        await addExpense(values);
        form.reset();
        setIsExpenseDialogOpen(false);
    };
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">K{financials.totalSales.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">From all delivered orders.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">K{financials.totalProfit.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Based on your profit margin settings.</p>
                    </CardContent>
                </Card>
                 <Card className={cn(financials.netOperatingProfit < 0 ? "border-destructive" : "border-green-500")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Operating Profit</CardTitle>
                        <AlertTriangle className={cn("h-4 w-4", financials.netOperatingProfit < 0 ? "text-destructive" : "text-green-500")} />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", financials.netOperatingProfit < 0 ? "text-destructive" : "text-green-500")}>K{financials.netOperatingProfit.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Gross Profit - Operational Costs</p>
                    </CardContent>
                </Card>
            </div>
             <div className="grid gap-4 md:grid-cols-2">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Capital Investment</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">K{financials.totalCapitalExpenses.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">e.g., coop, equipment.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Operational Costs</CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">K{financials.totalOperationalExpenses.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">e.g., feed, chicks, vaccines.</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Profit Margin Settings</CardTitle>
                    <CardDescription>Define the profit you make for each item sold. These values are used to calculate Gross Profit.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="profit-whole">Profit per Whole Chicken (K)</Label>
                            <Input id="profit-whole" type="number" value={prices.profit_whole || ''} onChange={(e) => setPrices({ ...prices, profit_whole: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profit-mixed">Profit per Mixed Piece (K)</Label>
                            <Input id="profit-mixed" type="number" value={prices.profit_mixedPiece || ''} onChange={(e) => setPrices({ ...prices, profit_mixedPiece: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </div>
                    <Separator />
                     <p className="text-sm font-medium text-muted-foreground">Profit per Custom Piece</p>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="profit-breasts">Breasts (K)</Label>
                            <Input id="profit-breasts" type="number" value={prices.profit_breasts || ''} onChange={(e) => setPrices({ ...prices, profit_breasts: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profit-thighs">Thighs (K)</Label>
                            <Input id="profit-thighs" type="number" value={prices.profit_thighs || ''} onChange={(e) => setPrices({ ...prices, profit_thighs: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profit-drumsticks">Drumsticks (K)</Label>
                            <Input id="profit-drumsticks" type="number" value={prices.profit_drumsticks || ''} onChange={(e) => setPrices({ ...prices, profit_drumsticks: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profit-wings">Wings (K)</Label>
                            <Input id="profit-wings" type="number" value={prices.profit_wings || ''} onChange={(e) => setPrices({ ...prices, profit_wings: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                     <Button onClick={saveAllSettings} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Profit Settings
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Expenses</CardTitle>
                        <CardDescription>a log of all your business expenses.</CardDescription>
                    </div>
                    <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Add Expense</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Expense</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleAddExpense)} className="space-y-4">
                                     <FormField control={form.control} name="expenseType" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expense Type</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                                                    <FormItem className="flex items-center space-x-2">
                                                        <FormControl>
                                                            <RadioGroupItem value="operational" id="operational" />
                                                        </FormControl>
                                                        <Label htmlFor="operational">Operational</Label>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-2">
                                                        <FormControl>
                                                            <RadioGroupItem value="capital" id="capital" />
                                                        </FormControl>
                                                        <Label htmlFor="capital">Capital</Label>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g., Chicken feed" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="amount" render={({ field }) => (
                                        <FormItem><FormLabel>Amount (K)</FormLabel><FormControl><Input type="number" placeholder="100.00" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="category" render={({ field }) => (
                                        <FormItem><FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                                <SelectContent>{expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                                            </Select>
                                        <FormMessage /></FormItem>
                                    )} />
                                    <DialogFooter>
                                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                                        <Button type="submit" disabled={form.formState.isSubmitting}>
                                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Expense
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {isMobile ? (
                         <div className="space-y-4">
                            {expenses.length > 0 ? expenses.map(expense => (
                                <Card key={expense.id} className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="font-semibold">{expense.description}</p>
                                            <p className="text-sm text-muted-foreground capitalize">{expense.expenseType} - {expense.category} - {expense.formattedDate}</p>
                                            <p className="text-lg font-bold text-primary">K{expense.amount.toFixed(2)}</p>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Delete this expense?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteExpense(expense.id)} className={cn(buttonVariants({variant: 'destructive'}))}>Delete</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </Card>
                            )) : (
                                <p className="text-center text-muted-foreground py-8">No expenses recorded yet.</p>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.length > 0 ? expenses.map(expense => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{expense.formattedDate}</TableCell>
                                        <TableCell>{expense.description}</TableCell>
                                        <TableCell className="capitalize">{expense.expenseType}</TableCell>
                                        <TableCell>{expense.category}</TableCell>
                                        <TableCell className="text-right font-mono">K{expense.amount.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Delete this expense?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteExpense(expense.id)} className={cn(buttonVariants({variant: 'destructive'}))}>Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">No expenses recorded yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
