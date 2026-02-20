'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit, Save, Tag, Package, ArrowUpDown, Loader2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';

const productSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, 'Name is required'),
    description: z.string().min(5, 'Description is required'),
    imageUrl: z.string().url('Invalid URL'),
    category: z.string().min(2, 'Category is required'),
    productType: z.enum(['chicken', 'generic']),
    isActive: z.boolean().default(true),
    displayOrder: z.coerce.number().min(1, 'Display order must be at least 1').default(10),
    variations: z.array(z.object({
        name: z.string().min(1, 'Variation name is required (e.g. Mongu Rice)'),
        options: z.array(z.object({
            name: z.string().min(1, 'Option name is required (e.g. 5kg)'),
            price: z.coerce.number().min(0.01, 'Price must be positive'),
            profit: z.coerce.number().min(0, 'Profit cannot be negative'),
        })).min(1, 'At least one option is required per variation'),
    })).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

function VariationItem({ control, variationIndex, removeVariation, register }: { control: any, variationIndex: number, removeVariation: (index: number) => void, register: any }) {
    const { fields: options, append: appendOption, remove: removeOption } = useFieldArray({
        control,
        name: `variations.${variationIndex}.options`,
    });

    return (
        <div className="space-y-4 border-2 border-primary/10 rounded-xl p-4 bg-primary/5">
            <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                    <Label className="text-xs font-bold uppercase text-primary/60">Variation Name (e.g. Mongu Rice)</Label>
                    <Input {...register(`variations.${variationIndex}.name`)} placeholder="Enter variation name" className="mt-1 font-bold" />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeVariation(variationIndex)} className="hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-5 w-5" />
                </Button>
            </div>

            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Options / Sizes</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendOption({ name: '', price: 0, profit: 0 })} className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" /> Add Size
                    </Button>
                </div>
                {options.map((option, optionIndex) => (
                    <div key={option.id} className="grid grid-cols-12 gap-2 items-end bg-background p-2 rounded-lg border shadow-sm">
                        <div className="col-span-5">
                            <Label className="text-[10px] text-muted-foreground">Size (e.g. 5kg)</Label>
                            <Input {...register(`variations.${variationIndex}.options.${optionIndex}.name`)} placeholder="Size" className="h-8 text-sm" />
                        </div>
                        <div className="col-span-3">
                            <Label className="text-[10px] text-muted-foreground">Price (K)</Label>
                            <Input type="number" {...register(`variations.${variationIndex}.options.${optionIndex}.price`)} className="h-8 text-sm" />
                        </div>
                        <div className="col-span-3">
                            <Label className="text-[10px] text-muted-foreground">Profit (K)</Label>
                            <Input type="number" {...register(`variations.${variationIndex}.options.${optionIndex}.profit`)} className="h-8 text-sm" />
                        </div>
                        <div className="col-span-1">
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(optionIndex)} disabled={options.length === 1} className="h-8 w-8">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProductFormDialog({ product, trigger }: { product?: Product, trigger?: React.ReactNode }) {
    const { saveProduct, isSaving } = useAdmin();
    const [open, setOpen] = useState(false);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            id: product?.id,
            name: product?.name || '',
            description: product?.description || '',
            imageUrl: product?.imageUrl || '',
            category: product?.category || 'poultry',
            productType: product?.productType || 'generic',
            isActive: product?.isActive ?? true,
            displayOrder: product?.displayOrder ?? 10,
            variations: product?.variations || [{ 
                name: 'Default', 
                options: [{ name: 'Standard', price: 0, profit: 0 }] 
            }],
        }
    });

    const { fields: variations, append: appendVariation, remove: removeVariation } = useFieldArray({
        control: form.control,
        name: "variations",
    });

    const productType = form.watch('productType');

    const onSubmit = async (values: ProductFormValues) => {
        await saveProduct(values);
        setOpen(false);
        if (!product) form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button size="sm" variant="outline"><Edit className="h-4 w-4 mr-2" /> Edit</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{product ? 'Edit Product' : 'Create New Product'}</DialogTitle>
                    <DialogDescription>Define your product, variations, and pricing tiers.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/10">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base font-bold">Visible to Customers</FormLabel>
                                    <FormDescription>Toggle off to hide from store.</FormDescription>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField control={form.control} name="displayOrder" render={({ field }) => (
                                <FormItem className="p-4 border rounded-xl bg-muted/10">
                                    <FormLabel className="text-base font-bold">Display Order</FormLabel>
                                    <FormDescription>Lower numbers appear first.</FormDescription>
                                    <FormControl>
                                        <Input type="number" {...field} className="font-bold" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold">Product Name (e.g. Rice)</FormLabel><FormControl><Input placeholder="Fresh Chicken" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="category" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold">Category</FormLabel><FormControl><Input placeholder="poultry" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold">Description</FormLabel><FormControl><Input placeholder="Brief catchy description" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold">Image URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="productType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold">Order Form Style</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="generic">Standard (Variations & Sizes)</SelectItem>
                                            <SelectItem value="chicken">Specialized Chicken Form</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {productType === 'generic' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold">Variations & Pricing</h3>
                                        <p className="text-sm text-muted-foreground">Add variations like "Mongu Rice" and define sizes for each.</p>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendVariation({ name: '', options: [{ name: '', price: 0, profit: 0 }] })}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Variation
                                    </Button>
                                </div>
                                
                                <div className="space-y-6">
                                    {variations.map((field, index) => (
                                        <VariationItem 
                                            key={field.id} 
                                            control={form.control} 
                                            variationIndex={index} 
                                            removeVariation={removeVariation}
                                            register={form.register}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
                            <Button type="submit" disabled={isSaving} size="lg" className="w-full">
                                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                Save Product
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function ProductsDashboard() {
    const { products, deleteProduct, saveProduct, isLoading, isSaving } = useAdmin();
    const isMobile = useIsMobile();

    const toggleStatus = (product: Product) => {
        saveProduct({ ...product, isActive: !product.isActive });
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Package className="h-8 w-8 text-primary" />
                    <h2 className="text-3xl font-bold font-headline tracking-tight">Product Catalog</h2>
                </div>
                <ProductFormDialog trigger={<Button size="lg"><Plus className="mr-2 h-5 w-5" /> Create Product</Button>} />
            </div>

            <div className="grid gap-6">
                {products.length > 0 ? (
                    isMobile ? (
                        products.map(product => (
                            <Card key={product.id} className={cn(!product.isActive && "opacity-60", "shadow-md")}>
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shadow-inner border">
                                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <CardTitle className="text-xl font-bold">{product.name}</CardTitle>
                                            <Badge variant={product.isActive ? "default" : "secondary"}>
                                                {product.isActive ? "Active" : "Disabled"}
                                            </Badge>
                                        </div>
                                        <CardDescription className="capitalize font-medium">{product.productType} • {product.category}</CardDescription>
                                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground font-bold">
                                            <ArrowUpDown className="h-3 w-3" /> Position: {product.displayOrder}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-2 italic">{product.description}</p>
                                    {product.productType === 'generic' && product.variations && (
                                        <div className="mt-4 space-y-2">
                                            {product.variations.map(v => (
                                                <div key={v.name} className="text-xs bg-muted/50 p-2 rounded-lg border">
                                                    <span className="font-bold text-primary mr-2">{v.name}:</span>
                                                    {v.options.map(o => `${o.name} (K${o.price})`).join(', ')}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-between items-center gap-2 bg-muted/20 border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <Switch 
                                            checked={product.isActive} 
                                            onCheckedChange={() => toggleStatus(product)} 
                                            disabled={isSaving}
                                        />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <ProductFormDialog product={product} />
                                        <Button variant="destructive" size="icon" onClick={() => deleteProduct(product.id)} disabled={isSaving}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <Card className="shadow-lg border-none overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[80px] font-bold">Order</TableHead>
                                        <TableHead className="font-bold">Preview</TableHead>
                                        <TableHead className="font-bold">Product Info</TableHead>
                                        <TableHead className="font-bold">Type</TableHead>
                                        <TableHead className="font-bold">Status</TableHead>
                                        <TableHead className="font-bold">Pricing Tiers</TableHead>
                                        <TableHead className="text-right font-bold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map(product => (
                                        <TableRow key={product.id} className={cn(!product.isActive && "bg-muted/30 opacity-70")}>
                                            <TableCell className="font-black text-center text-lg text-primary/40">
                                                {product.displayOrder}
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted border shadow-sm">
                                                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-lg">{product.name}</div>
                                                <div className="text-xs text-muted-foreground font-medium uppercase tracking-tight">{product.category}</div>
                                            </TableCell>
                                            <TableCell className="capitalize font-medium">
                                                <Badge variant="outline" className="border-primary/20">{product.productType}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Switch 
                                                        checked={product.isActive} 
                                                        onCheckedChange={() => toggleStatus(product)} 
                                                        disabled={isSaving}
                                                    />
                                                    <Badge variant={product.isActive ? "default" : "secondary"}>
                                                        {product.isActive ? "Active" : "Disabled"}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {product.productType === 'chicken' ? (
                                                    <span className="text-xs font-bold italic text-primary/60">Using global chicken pricing</span>
                                                ) : (
                                                    <div className="flex flex-col gap-1 max-w-xs">
                                                        {product.variations?.map((v, i) => (
                                                            <div key={i} className="text-[10px] bg-muted/80 px-2 py-1 rounded-md border flex justify-between gap-4">
                                                                <span className="font-black truncate">{v.name}</span>
                                                                <span className="shrink-0 text-muted-foreground">{v.options.length} options</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <ProductFormDialog product={product} />
                                                    <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)} disabled={isSaving} className="hover:bg-destructive/10">
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )
                ) : (
                    <Card className="p-20 text-center text-muted-foreground bg-muted/10 border-2 border-dashed">
                        <Tag className="h-16 w-16 mx-auto mb-4 opacity-10" />
                        <h3 className="text-xl font-bold">Your store is empty</h3>
                        <p className="mt-2">Start by creating your first product to see it on the storefront.</p>
                        <Button variant="outline" className="mt-6">
                            <Plus className="h-4 w-4 mr-2" /> Add Your First Product
                        </Button>
                    </Card>
                )}
            </div>
        </div>
    );
}
