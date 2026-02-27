'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react";
import { api } from "../../../../utils/axios";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit, Eye } from "lucide-react";
import NextImage from "next/image";
import { ROLES } from "../../../../role.config";
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../../utils/petPagesConfig.vi';
import enConfig from '../../../../utils/petPagesConfig.en';

export interface Address {
    _id?: string;
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
}

export interface User {
    _id?: string;
    name: string;
    address: Address[];
    email: string;
    password: string;
    phone?: string;
    dob?: Date;
    role: number;
    verified: boolean;
    verificationToken?: string;
    verificationTokenExpires?: Date;
    googleId?: string;
    avatar?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const ROLE_COLORS = {
    CUSTOMER: "bg-blue-100 text-blue-800",
    STAFF: "bg-green-100 text-green-800",
} as const;

const ROLE_LABELS = {
    CUSTOMER: "Customer",
    STAFF: "Staff",
} as const;

const parseRoles = (bitmask: number) => {
    const activeRoles = [];
    for (const [roleName, roleValue] of Object.entries(ROLES)) {
        if ((Math.abs(bitmask) & roleValue) === roleValue) {
            activeRoles.push(roleName);
        }
    }
    return activeRoles;
};

const getRoleBadge = (role: number) => {
    const activeRoles = parseRoles(role);
    return (
        <div className="flex flex-wrap gap-1">
            {activeRoles.map((roleName) => (
                <Badge
                    key={roleName}
                    className={ROLE_COLORS[roleName as keyof typeof ROLE_COLORS]}
                >
                    {ROLE_LABELS[roleName as keyof typeof ROLE_LABELS]}
                </Badge>
            ))}
        </div>
    );
};

interface RoleSelectorProps {
    value: number;
    onChange: (value: number) => void;
}

function RoleSelector({ value, onChange, config }: RoleSelectorProps & { config: any }) {
    const toggleRole = (roleValue: number) => {
        if (value === 0) {
            onChange(roleValue);
        } else {
            onChange(value ^ roleValue);
        }
    };

    const isRoleActive = (roleValue: number) => {
        return (value & roleValue) === roleValue;
    };

    return (
        <div className="flex flex-wrap gap-2">
            {Object.entries(ROLES).map(([roleName, roleValue]) => (
                <Badge
                    key={roleName}
                    className={`cursor-pointer ${ROLE_COLORS[roleName as keyof typeof ROLE_COLORS]} ${isRoleActive(roleValue) ? 'ring-2 ring-offset-2 ring-primary' : ''
                        }`}
                    onClick={() => toggleRole(roleValue)}
                >
                    {config.table.headers[roleName.toLowerCase()] || roleName}
                </Badge>
            ))}
        </div>
    );
}

interface UserFormProps {
    user?: User;
    onSubmit: (data: Omit<User, '_id'>) => void;
    isOpen: boolean;
    onClose: () => void;
}

function UserForm({ user, onSubmit, isOpen, onClose, config }: UserFormProps & { config: any }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        dob: '',
        role: 0,
        verified: false,
        address: [{
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: ''
        }]
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: user.password || '',
                phone: user.phone || '',
                dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
                role: user.role || 0,
                verified: user.verified || false,
                address: user.address.map(addr => ({
                    street: addr.street || '',
                    city: addr.city || '',
                    state: addr.state || '',
                    postalCode: addr.postalCode || '',
                    country: addr.country || ''
                }))
            });
        }
    }, [user]);

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            dob: '',
            role: 0,
            verified: false,
            address: [{
                street: '',
                city: '',
                state: '',
                postalCode: '',
                country: ''
            }]
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userData: Omit<User, '_id'> = {
                ...formData,
                dob: formData.dob ? new Date(formData.dob) : undefined
            };
            await onSubmit(userData);
            onClose();
        } catch (error) {
            console.error('Error saving user:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="xl:max-w-[1000px] w-full max-h-screen overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{user ? config.form.editTitle : config.form.addTitle}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{config.form.fields.name} <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                value={formData.name}
                                disabled={user ? true : false}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{config.form.fields.email} <span className="text-red-500">*</span></Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                disabled={user ? true : false}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {!user && (
                        <div className="space-y-2">
                            <Label htmlFor="password">{config.form.fields.password} <span className="text-red-500">*</span></Label>
                            <Input
                                id="password"
                                type="password"
                                disabled={user ? true : false}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!user}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">{config.form.fields.phone}</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                disabled={user ? true : false}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dob">{config.form.fields.dob}</Label>
                            <Input
                                id="dob"
                                type="date"
                                disabled={user ? true : false}
                                value={formData.dob}
                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{config.form.fields.role} <span className="text-red-500">*</span></Label>
                        <RoleSelector
                            value={formData.role}
                            onChange={(value) => setFormData({ ...formData, role: value })}
                            config={config}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>{config.form.fields.address}</Label>
                        {formData.address.map((address, index) => (
                            <div key={index} className="relative grid grid-cols-2 gap-4 p-4 border rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const updatedAddress = [...formData.address];
                                        updatedAddress.splice(index, 1);
                                        setFormData({ ...formData, address: updatedAddress });
                                    }}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                                >
                                    ✕
                                </button>

                                <div className="space-y-2">
                                    <Label>{config.form.fields.street}</Label>
                                    <Input
                                        value={address.street}
                                        onChange={(e) => {
                                            const newAddress = [...formData.address];
                                            newAddress[index] = { ...address, street: e.target.value };
                                            setFormData({ ...formData, address: newAddress });
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{config.form.fields.city}</Label>
                                    <Input
                                        value={address.city}
                                        onChange={(e) => {
                                            const newAddress = [...formData.address];
                                            newAddress[index] = { ...address, city: e.target.value };
                                            setFormData({ ...formData, address: newAddress });
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{config.form.fields.state}</Label>
                                    <Input
                                        value={address.state}
                                        onChange={(e) => {
                                            const newAddress = [...formData.address];
                                            newAddress[index] = { ...address, state: e.target.value };
                                            setFormData({ ...formData, address: newAddress });
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{config.form.fields.postalCode}</Label>
                                    <Input
                                        value={address.postalCode}
                                        onChange={(e) => {
                                            const newAddress = [...formData.address];
                                            newAddress[index] = { ...address, postalCode: e.target.value };
                                            setFormData({ ...formData, address: newAddress });
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{config.form.fields.country}</Label>
                                    <Input
                                        value={address.country}
                                        onChange={(e) => {
                                            const newAddress = [...formData.address];
                                            newAddress[index] = { ...address, country: e.target.value };
                                            setFormData({ ...formData, address: newAddress });
                                        }}
                                    />
                                </div>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFormData({
                                ...formData,
                                address: [...formData.address, {
                                    street: '',
                                    city: '',
                                    state: '',
                                    postalCode: '',
                                    country: ''
                                }]
                            })}
                        >
                            {config.form.addAddress}
                        </Button>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            {config.form.buttons.cancel}
                        </Button>
                        <Button type="submit">
                            {user ? config.form.buttons.save : config.form.buttons.add}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Main component
export default function UserPage() {
    const { lang } = useLanguage();
    const pagesConfig = lang === 'vi' ? viConfig : enConfig;
    const config = pagesConfig.userManagement;
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState<string>("all");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | undefined>();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await api.get('/users/admin');
            setUsers(data.data.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (data: Omit<User, '_id'>) => {
        try {
            const response = await api.post('/users', data);
            if (response.data && response.data.data) {
                setUsers([...users, response.data.data]);
            } else {
                setUsers([...users, response.data]);
            }
            fetchUsers();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleEditUser = async (data: Omit<User, '_id'>) => {
        if (!selectedUser) return;
        try {
            const response = await api.put(`/users/${selectedUser._id}`, data);
            setUsers(users.map(user =>
                user._id === selectedUser._id ? response.data.data : user
            ));
            fetchUsers();
            setIsFormOpen(false);
            setSelectedUser(undefined);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleViewDetail = (user: User) => {
        setSelectedUser(user);
        setIsDetailOpen(true);
    };

    const changeActiveStatus = async (user: User) => {
        try {
            const updatedUser = { ...user, role: -user.role };
            const response = await api.put(`/users/${user._id}`, updatedUser);
            setUsers(users.map(u => u._id === user._id ? response.data.data : u));
            fetchUsers();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            (user?.name && user.name.toLowerCase().includes(searchQuery?.toLowerCase())) ||
            (user?.email && user.email.toLowerCase().includes(searchQuery?.toLowerCase()));

        const matchesRole = selectedRole === "all" ||
            parseRoles(user.role).includes(selectedRole);

        return matchesSearch && matchesRole;
    });

    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{config.title}</CardTitle>
                        <div className="flex gap-2">
                            <Button onClick={() => {
                                setSelectedUser(undefined);
                                setIsFormOpen(true);
                            }}>{config.addNewButton}</Button>
                            {/* Import Users Button */}
                            <input
                                type="file"
                                accept=".csv"
                                id="import-users-csv"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    try {
                                        await api.post('/users/import-csv', formData, {
                                            headers: { 'Content-Type': 'multipart/form-data' },
                                        });
                                        alert(config.alert.importSuccess);
                                        fetchUsers();
                                    } catch (err: any) {
                                        alert(config.alert.importFail + (err.response?.data?.message || err.message));
                                    } finally {
                                        e.target.value = '';
                                    }
                                }}
                            />
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const input = document.getElementById('import-users-csv') as HTMLInputElement;
                                    if (input) input.click();
                                }}
                            >
                                {config.importCSV}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    try {
                                        const response = await api.get('/users/export-csv', { responseType: 'blob' });
                                        const url = window.URL.createObjectURL(new Blob([response.data]));
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', 'users.csv');
                                        document.body.appendChild(link);
                                        link.click();
                                        link.parentNode?.removeChild(link);
                                    } catch (err: any) {
                                        alert(config.alert.exportFail + (err.response?.data?.message || err.message));
                                    }
                                }}
                            >
                                {config.exportAll}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                        <Input
                            placeholder={config.search.placeholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-sm"
                        />
                        <Select
                            value={selectedRole}
                            onValueChange={setSelectedRole}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={config.search.rolePlaceholder} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{config.table.headers.role}</SelectItem>
                                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                                    <SelectItem key={role} value={role}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {loading ? (
                        <div>{config.loading}</div>
                    ) : error ? (
                        <div className="text-red-500">{config.error} {error}</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{config.table.headers.no}</TableHead>
                                    <TableHead>{config.table.headers.name}</TableHead>
                                    <TableHead>{config.table.headers.email}</TableHead>
                                    <TableHead>{config.table.headers.role}</TableHead>
                                    <TableHead>{config.table.headers.active}</TableHead>
                                    <TableHead>{config.table.headers.status}</TableHead>
                                    <TableHead className="text-right">{config.table.headers.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedUsers.map((user, index) => (
                                    <TableRow key={user._id}>
                                        <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                                        <TableCell>
                                            <Badge onClick={() => changeActiveStatus(user)} className={`cursor-pointer ${user.role > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                {user.role > 0 ? config.status.active : config.status.inactive}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.verified ? 'default' : 'secondary'}>
                                                {user.verified ? config.status.verified : config.status.unverified}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    title={config.detail.title}
                                                    onClick={() => handleViewDetail(user)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    title={config.form.editTitle}
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setIsFormOpen(true);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <UserForm
                user={selectedUser}
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setSelectedUser(undefined);
                }}
                onSubmit={selectedUser ? handleEditUser : handleAddUser}
                config={config}
            />

            <Dialog open={isDetailOpen} onOpenChange={() => setIsDetailOpen(false)}>
                <DialogContent className="xl:max-w-[1000px] w-full max-h-screen overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{config.detail.title}</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                                    {selectedUser.avatar ? (
                                        <NextImage
                                            src={selectedUser.avatar}
                                            alt={selectedUser.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400">
                                            {selectedUser.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">{selectedUser.name}</h3>
                                    <p className="text-gray-500">{selectedUser.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{config.detail.phone}</Label>
                                    <p className="text-lg font-medium">{selectedUser.phone || config.notAvailable}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>{config.detail.dob}</Label>
                                    <p className="text-lg font-medium">
                                        {selectedUser.dob ? new Date(selectedUser.dob).toLocaleDateString() : config.notAvailable}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>{config.detail.role}</Label>
                                    <div>{getRoleBadge(selectedUser.role)}</div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{config.detail.status}</Label>
                                    <Badge variant={selectedUser.verified ? 'default' : 'secondary'}>
                                        {selectedUser.verified ? config.status.verified : config.status.unverified}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>{config.detail.addresses}</Label>
                                {selectedUser.address.map((addr, index) => (
                                    <div key={index} className="p-4 border rounded-lg space-y-2">
                                        <p><strong>{config.form.fields.street}:</strong> {addr.street}</p>
                                        <p><strong>{config.form.fields.city}:</strong> {addr.city}</p>
                                        <p><strong>{config.form.fields.state}:</strong> {addr.state || config.notAvailable}</p>
                                        <p><strong>{config.form.fields.postalCode}:</strong> {addr.postalCode}</p>
                                        <p><strong>{config.form.fields.country}:</strong> {addr.country}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <Label>{config.detail.accountInfo}</Label>
                                <p><strong>{config.detail.createdAt}:</strong> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : config.notAvailable}</p>
                                <p><strong>{config.detail.updatedAt}:</strong> {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleString() : config.notAvailable}</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Pagination
                filteredUsers={filteredUsers}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                setItemsPerPage={setItemsPerPage}
                setCurrentPage={setCurrentPage}
                config={config}
            />
        </div>
    );
}

interface PaginationProps {
    filteredUsers: User[];
    itemsPerPage: number;
    currentPage: number;
    setItemsPerPage: (value: number) => void;
    setCurrentPage: (value: number) => void;
}

function Pagination({ filteredUsers, itemsPerPage, currentPage, setItemsPerPage, setCurrentPage, config }: PaginationProps & { config: any }) {
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                >
                    {config.pagination.previous}
                </Button>
                <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, index) => (
                        <Button
                            key={index + 1}
                            variant={currentPage === index + 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(index + 1)}
                        >
                            {index + 1}
                        </Button>
                    ))}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    {config.pagination.next}
                </Button>
            </div>
        </div>
    );
}
