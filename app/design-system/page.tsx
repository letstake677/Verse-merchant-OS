"use client"

import * as React from "react"
import Link from "next/link"
import {
  Sparkles,
  ArrowLeft,
  Copy,
  Plus,
  Trash2,
  Send,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  TrendingUp,
  CreditCard,
  FileText,
  User,
  MoreVertical,
  ExternalLink,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge, PaymentOrInvoiceStatus } from "@/components/ui/status-badge"
import { StatCard } from "@/components/ui/stat-card"
import { Avatar } from "@/components/ui/avatar"
import { Tabs } from "@/components/ui/tabs"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Dialog } from "@/components/ui/dialog"
import { Drawer } from "@/components/ui/drawer"
import { Tooltip } from "@/components/ui/tooltip"
import { ToastProvider, useToast } from "@/components/ui/toast"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/loading-state"
import { PageHeader } from "@/components/ui/page-header"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu } from "@/components/ui/dropdown-menu"

function DesignSystemContent() {
  const { toast } = useToast()

  // State for interactive demos
  const [activeTab, setActiveTab] = React.useState("buttons")
  const [buttonLoading, setButtonLoading] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [checkboxState, setCheckboxState] = React.useState(true)
  const [switchState, setSwitchState] = React.useState(true)

  const allStatuses: PaymentOrInvoiceStatus[] = [
    "paid",
    "confirmed",
    "pending",
    "verifying",
    "overdue",
    "failed",
    "cancelled",
    "draft",
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24 antialiased">
      {/* Top Banner */}
      <header className="sticky top-0 z-30 bg-white/95 border-b border-slate-200 px-4 sm:px-8 py-3.5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App Shell</span>
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 tracking-tight">
                Verse Merchant OS
              </span>
              <Badge variant="verse" className="text-[10px]">
                Design System v1.0
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                toast({
                  title: "Design System Specs",
                  description: "All components conform to Phase 2 fintech SaaS specifications.",
                  type: "info",
                })
              }
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 mr-1" />
              Specs Ready
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-12">
        {/* Page Title & Intro */}
        <PageHeader
          title="Design System & Component Library"
          description="A minimalist, high-contrast, fintech-grade design token system and UI kit built for Verse Merchant OS."
          badge={
            <Badge variant="success" className="text-[10px]">
              Phase 2 Verified
            </Badge>
          }
          primaryAction={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setButtonLoading(true)
                setTimeout(() => setButtonLoading(false), 1500)
              }}
              isLoading={buttonLoading}
              loadingText="Simulating Action..."
            >
              Test Action
            </Button>
          }
          secondaryAction={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              Open Dialog Demo
            </Button>
          }
        />

        {/* SECTION 1: TYPOGRAPHY & NUMERIC VALUES */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">1. Typography Hierarchy</h2>
            <p className="text-xs text-slate-500">
              Clear typographic scaling with tabular numeric values for fintech legibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Heading Scales</CardTitle>
                <CardDescription>Hierarchical scales for titles and labels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400">Display Heading</span>
                  <div className="text-3xl font-bold tracking-tight text-slate-900">
                    Verse Merchant OS
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400">Page Heading</span>
                  <div className="text-xl font-semibold tracking-tight text-slate-900">
                    Invoices & Payment Requests
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400">Section Heading</span>
                  <div className="text-sm font-semibold text-slate-900">
                    Recent Customer Transactions
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400">Body & Secondary Text</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Transactions submitted through Polygon are verified automatically with smart receipts.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial & Numeric Stat Formats</CardTitle>
                <CardDescription>Monospaced and tabular numeral pairings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 uppercase">Gross Volume</span>
                    <div className="text-2xl font-bold text-slate-900 font-tabular">$4,280.00</div>
                  </div>
                  <Badge variant="success">+18.4% this month</Badge>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 uppercase">Settled Transactions</span>
                    <div className="text-2xl font-bold text-slate-900 font-tabular">48 payments</div>
                  </div>
                  <Badge variant="verse">Polygon Verified</Badge>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 uppercase">Pending Invoices</span>
                    <div className="text-2xl font-bold text-amber-600 font-tabular">$620 pending</div>
                  </div>
                  <Badge variant="warning">3 awaiting payer</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 2: BUTTON SYSTEM */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">2. Button Hierarchy & Variants</h2>
            <p className="text-xs text-slate-500">
              Structured action priorities with hover, active, focus, disabled, and loading states.
            </p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Variants
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">
                    <Plus className="w-4 h-4" /> Create Invoice
                  </Button>
                  <Button variant="secondary">
                    <Download className="w-4 h-4" /> Export CSV
                  </Button>
                  <Button variant="verse">
                    <Sparkles className="w-4 h-4" /> Pay with Verse
                  </Button>
                  <Button variant="outline">
                    <Copy className="w-4 h-4" /> Copy Link
                  </Button>
                  <Button variant="ghost">View Details</Button>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4" /> Void Invoice
                  </Button>
                  <Button variant="link">Terms of Service</Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sizes & Interactive States
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small (32px)</Button>
                  <Button size="default">Default (36px)</Button>
                  <Button size="lg">Large (44px)</Button>
                  <Button size="icon" variant="secondary" aria-label="Settings icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                  <Button isLoading loadingText="Confirming...">
                    Submit
                  </Button>
                  <Button disabled variant="primary">
                    Disabled State
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 3: STATUS BADGES SYSTEM */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">3. Status & Lifecycle Badges</h2>
            <p className="text-xs text-slate-500">
              Uniform status badges across all payment, verification, and invoice stages.
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {allStatuses.map((status) => (
                  <div
                    key={status}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col items-start gap-2"
                  >
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      status: {status}
                    </span>
                    <StatusBadge status={status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 4: FORM CONTROLS */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">4. Form Inputs & Controls</h2>
            <p className="text-xs text-slate-500">
              Clean input surfaces, selects, checkboxes, and switches with accessible focus states.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Text & Select Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1.5">
                    Customer Email
                  </label>
                  <Input
                    placeholder="client@acme.corp"
                    startIcon={<User className="w-4 h-4" />}
                    helperText="Receipt will be automatically dispatched upon Polygon confirmation."
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1.5">
                    Requested Amount (USD Equivalent)
                  </label>
                  <Input
                    placeholder="150.00"
                    startIcon={<DollarSign className="w-4 h-4" />}
                    defaultValue="150.00"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1.5">
                    Settlement Asset
                  </label>
                  <Select defaultValue="verse-polygon">
                    <option value="verse-polygon">VERSE (Polygon Network)</option>
                    <option value="polygon-matic">POL / MATIC (Polygon Native)</option>
                    <option value="usdc-polygon">USDC (Polygon Bridged)</option>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1.5">
                    Validation Error State
                  </label>
                  <Input
                    defaultValue="invalid_wallet_address"
                    error
                    helperText="Please provide a valid 0x Polygon wallet address."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Textarea, Toggles & Checkboxes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1.5">
                    Invoice Memo / Description
                  </label>
                  <Textarea
                    placeholder="Brand identity design for Q3 product launch..."
                    defaultValue="Branding and design sprint milestone 1 deliverables."
                    helperText="Visible on customer payment and receipt screens."
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Switch
                    label="Auto-generate public receipt"
                    description="Allow customer to access instant verified shareable link."
                    checked={switchState}
                    onChange={(e) => setSwitchState(e.target.checked)}
                  />

                  <Checkbox
                    label="Send merchant copy to email"
                    description="Dispatch an instant notification when Polygon transaction confirms."
                    checked={checkboxState}
                    onChange={(e) => setCheckboxState(e.target.checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 5: STAT CARDS METRICS */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">5. Metric & Stat Cards</h2>
            <p className="text-xs text-slate-500">
              Clean dashboard summary blocks with trends, labels, and icons.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Revenue"
              value="$4,280.00"
              trend={{ value: "+18.4%", isPositive: true, label: "vs last month" }}
              icon={TrendingUp}
              badge="USD Val"
            />
            <StatCard
              title="Settled Payments"
              value="48"
              trend={{ value: "+12", isPositive: true, label: "this cycle" }}
              icon={CreditCard}
            />
            <StatCard
              title="Pending Invoices"
              value="$620.00"
              trend={{ value: "3 invoices", isNeutral: true, label: "awaiting pay" }}
              icon={FileText}
            />
            <StatCard
              title="Avg Settlement Time"
              value="2.4s"
              trend={{ value: "Polygon Speed", isPositive: true }}
              icon={ShieldCheck}
            />
          </div>
        </section>

        {/* SECTION 6: TABLE SYSTEM */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">6. Reusable Table System</h2>
            <p className="text-xs text-slate-500">
              Responsive tabular ledger for transactions, invoices, and customer histories.
            </p>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Real-time mock feed demonstrating table layout</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Filter payments..."
                  className="w-48 h-8 text-xs"
                  startIcon={<Search className="w-3.5 h-3.5" />}
                />
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Asset & Network</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    customer: "Acme Design Co.",
                    email: "alex@acme.design",
                    invoice: "INV-1024",
                    amount: "$150.00",
                    verse: "1,250,000 VERSE",
                    status: "paid" as PaymentOrInvoiceStatus,
                    date: "Aug 19, 2026",
                    tx: "0x8f3...91ac",
                  },
                  {
                    customer: "Nova Creative Agency",
                    email: "billing@nova.agency",
                    invoice: "INV-1025",
                    amount: "$420.00",
                    verse: "3,500,000 VERSE",
                    status: "verifying" as PaymentOrInvoiceStatus,
                    date: "Aug 19, 2026",
                    tx: "0x3b1...77ea",
                  },
                  {
                    customer: "Horizon Studio",
                    email: "payments@horizon.io",
                    invoice: "INV-1026",
                    amount: "$85.00",
                    verse: "710,000 VERSE",
                    status: "pending" as PaymentOrInvoiceStatus,
                    date: "Aug 18, 2026",
                    tx: "-",
                  },
                  {
                    customer: "Apex Media Labs",
                    email: "finance@apexmedia.co",
                    invoice: "INV-1027",
                    amount: "$320.00",
                    verse: "2,660,000 VERSE",
                    status: "overdue" as PaymentOrInvoiceStatus,
                    date: "Aug 12, 2026",
                    tx: "-",
                  },
                ].map((row) => (
                  <TableRow key={row.invoice}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar fallback={row.customer} size="sm" />
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{row.customer}</p>
                          <p className="text-[11px] text-slate-400">{row.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium text-slate-700">
                      {row.invoice}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-semibold text-slate-900 font-tabular text-xs">
                          {row.amount}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">{row.verse}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <span className="font-medium">Verse</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-400">Polygon</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{row.date}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu
                        trigger={
                          <button
                            type="button"
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            aria-label="Row options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        }
                        items={[
                          {
                            id: "receipt",
                            label: "View Payment Receipt",
                            icon: <FileText className="w-3.5 h-3.5" />,
                            onClick: () =>
                              toast({
                                title: `Opening Receipt for ${row.invoice}`,
                                description: "Verified receipt preview modal triggered.",
                                type: "info",
                              }),
                          },
                          {
                            id: "tx",
                            label: "View on Polygonscan",
                            icon: <ExternalLink className="w-3.5 h-3.5" />,
                            onClick: () =>
                              toast({
                                title: "Polygonscan Explorer",
                                description: `Simulating redirect to explorer for ${row.tx}`,
                                type: "info",
                              }),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* SECTION 7: INTERACTIVE OVERLAYS & TOASTS */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              7. Dialogs, Drawers & Toast Notifications
            </h2>
            <p className="text-xs text-slate-500">
              Animated modal overlays and responsive feedback notifications.
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                  Trigger Dialog Modal
                </Button>
                <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
                  Trigger Slide Drawer
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast({
                      title: "Payment Received",
                      description: "$150.00 confirmed on Polygon via Verse token.",
                      type: "success",
                    })
                  }
                >
                  Success Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast({
                      title: "Transaction Pending",
                      description: "Waiting for Polygon block confirmation (block #6281923).",
                      type: "warning",
                    })
                  }
                >
                  Warning Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast({
                      title: "Verification Failed",
                      description: "The payment hash was not recognized on Polygon.",
                      type: "error",
                    })
                  }
                >
                  Error Toast
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 8: EMPTY, ERROR & LOADING STATES */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              8. Empty, Error & Loading Skeletons
            </h2>
            <p className="text-xs text-slate-500">
              Standardized fallback surfaces for zero-data and network recovery flows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EmptyState
              title="No payments yet"
              description="Your payments will appear here once a customer completes an invoice payment with Verse."
              actionLabel="Create Invoice"
              onAction={() =>
                toast({
                  title: "Create Invoice",
                  description: "Invoice creation will be built in Phase 5.",
                  type: "info",
                })
              }
            />

            <ErrorState
              title="Failed to fetch transaction stream"
              description="We couldn't connect to the Polygon RPC node. Please verify network status."
              onRetry={() =>
                toast({
                  title: "Retrying Connection",
                  description: "Simulating RPC reconnect...",
                  type: "info",
                })
              }
            />
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Skeleton Loading States
            </h3>
            <StatCardSkeleton count={4} />
            <TableSkeleton rows={3} cols={4} />
          </div>
        </section>
      </div>

      {/* Reusable Dialog Demo */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Payment Link Preview"
        description="Shareable invoice payment portal for customer"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setDialogOpen(false)
                toast({
                  title: "Payment Link Copied",
                  description: "https://versemerchant.os/pay/inv_1024",
                  type: "success",
                })
              }}
            >
              Copy Payment URL
            </Button>
          </>
        }
      >
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between text-slate-500">
            <span>Invoice Ref</span>
            <span className="font-mono text-slate-900">#INV-1024</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Payable Amount</span>
            <span className="font-semibold text-slate-900">$150.00 (VERSE)</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Blockchain</span>
            <span className="font-medium text-slate-900">Polygon Network</span>
          </div>
        </div>
      </Dialog>

      {/* Reusable Drawer Demo */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Transaction Details"
        description="Inspect Polygon verified smart contract receipt"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(false)}>
            Dismiss
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Transaction confirmed in block #6281920</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">From Wallet</span>
              <span className="font-mono text-slate-800">0x4b7...19a2</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">To Merchant</span>
              <span className="font-mono text-slate-800">0xAcme...Design</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Token</span>
              <span className="font-medium text-indigo-700">VERSE</span>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}

export default function DesignSystemPage() {
  return <DesignSystemContent />
}
