import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { ErpProvider, useErp } from './context/ErpContext.jsx';
import Layout from './components/Layout.jsx';
import { LoginPage, TreeDashboardPage } from './pages/LoginPage.jsx';
import {
  TradersGroupPage, TradersInfoPage, CategoryPage, ProductGroupPage,
  BrandPage, ProductInfoPage, PriceSetupPage, ColorPage
} from './pages/PrimarySetupPages.jsx';
import {
  AccountSubGroupPage, AccountLedgerPage, BankPage, BankAccountPage,
  ChequeBookEntryPage, UserEntryPage, DatabaseBackupPage, DailyBusinessPage,
  EmployeePage
} from './pages/AccountsAdminHrmPages.jsx';
import {
  PurchasePage, PurchaseReturnPage, PriceQuotationPage, SalesPage,
  SalesReturnPage, SerialSearchPage, MobileSearchPage, DateWiseBillSearchPage
} from './pages/TradingPages.jsx';
import {
  StockTransferCommPage, StockTransferBrPage, StockTransferCommToRmaPage,
  StockTransferRmaToCommPage, StockReceivedBrToBrPage,
  ComplainReceivePage, ReplaceOutPage, ReplaceInPage,
  ReplacementDeliveryPage, RmaSerialSearchPage
} from './pages/TransferRmaPages.jsx';
import {
  ServiceGroupPage, ProblemGroupPage, ServicePage, ProblemPage, ServiceBillPage,
  PaymentPage, CollectionPage, BankTransactionPage, JournalPage,
  ChequeSearchPage, DateWiseCollectionSearchPage, SalaryProcessPage, BalanceTransferPage
} from './pages/ServicingAccountsPages.jsx';
import {
  PurchaseReportsPage, SalesReportsPage, TradersReportsPage, AccountsReportsPage,
  StockReportsPage, BankReportsPage, RmaReportsPage, ModificationReportsPage,
  ExportExcelPage
} from './pages/ReportsPages.jsx';

function ProtectedRoute({ children }) {
  const { session, hasRouteAccess, switchAccount } = useErp();
  const location = useLocation();
  if (!session) {
    return <Navigate to="/LOGIN.aspx" replace />;
  }
  const allowed = hasRouteAccess(location.pathname);
  return (
    <Layout>
      {allowed ? (
        children
      ) : (
        <div className="erp-container erp-container-narrow">
          <div className="erp-fieldset text-center py-5">
            <h4 className="fw-bold text-danger mb-2">Access Restricted for Admin ID: {session.userName}</h4>
            <p className="text-muted mb-3">
              The module <code>{location.pathname}</code> is not enabled in your current Admin Power allocation ({session.permissions?.roleLabel || 'Custom Admin'}).
            </p>
            <div className="d-flex justify-content-center gap-2">
              <Link to="/GI/TREE.aspx" className="erp-btn text-decoration-none">
                Go to Permitted Dashboard Options
              </Link>
              <button type="button" id="SAVE" className="erp-btn" onClick={() => switchAccount('jubayer')}>
                Switch to Master Super Admin (JUBAYER)
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <ErpProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/LOGIN.aspx" replace />} />
          <Route path="/LOGIN.aspx" element={<LoginPage />} />
          <Route path="/GI/TREE.aspx" element={<ProtectedRoute><TreeDashboardPage /></ProtectedRoute>} />

          {/* 1. Primary Setup (8) */}
          <Route path="/GI/CSGROUP.aspx" element={<ProtectedRoute><TradersGroupPage /></ProtectedRoute>} />
          <Route path="/GI/CUSTOMERINFORMATION.aspx" element={<ProtectedRoute><TradersInfoPage /></ProtectedRoute>} />
          <Route path="/GI/CATEGORY.aspx" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
          <Route path="/GI/PRODUCTGROUP.aspx" element={<ProtectedRoute><ProductGroupPage /></ProtectedRoute>} />
          <Route path="/GI/BRAND.aspx" element={<ProtectedRoute><BrandPage /></ProtectedRoute>} />
          <Route path="/GI/PRODUCTINFORMATION.aspx" element={<ProtectedRoute><ProductInfoPage /></ProtectedRoute>} />
          <Route path="/GI/PRICE_SETUP.aspx" element={<ProtectedRoute><PriceSetupPage /></ProtectedRoute>} />
          <Route path="/GI/COLOR.aspx" element={<ProtectedRoute><ColorPage /></ProtectedRoute>} />

          {/* 2. Accounts Setup (5) */}
          <Route path="/GI/ACCOUNTSUBSGROUP.aspx" element={<ProtectedRoute><AccountSubGroupPage /></ProtectedRoute>} />
          <Route path="/GI/ACCOUNTSLEDGER.aspx" element={<ProtectedRoute><AccountLedgerPage /></ProtectedRoute>} />
          <Route path="/GI/BANK.aspx" element={<ProtectedRoute><BankPage /></ProtectedRoute>} />
          <Route path="/GI/BANKBRANCH.aspx" element={<ProtectedRoute><BankAccountPage /></ProtectedRoute>} />
          <Route path="/GI/CHQUE_ENTRY.aspx" element={<ProtectedRoute><ChequeBookEntryPage /></ProtectedRoute>} />

          {/* 3. Admin Tools (3) */}
          <Route path="/GI/USERENTRY.aspx" element={<ProtectedRoute><UserEntryPage /></ProtectedRoute>} />
          <Route path="/GI/DATABASEBACKUP.aspx" element={<ProtectedRoute><DatabaseBackupPage /></ProtectedRoute>} />
          <Route path="/GI/DAILY_BUSINESS.aspx" element={<ProtectedRoute><DailyBusinessPage /></ProtectedRoute>} />

          {/* 4. HRM (1) */}
          <Route path="/GI/EMPLOYEE.aspx" element={<ProtectedRoute><EmployeePage /></ProtectedRoute>} />

          {/* 5. Trading (8) */}
          <Route path="/GI/PURCHASE.aspx" element={<ProtectedRoute><PurchasePage /></ProtectedRoute>} />
          <Route path="/GI/PURCHASE_RETURN.aspx" element={<ProtectedRoute><PurchaseReturnPage /></ProtectedRoute>} />
          <Route path="/GI/PRICEQUOTATION.aspx" element={<ProtectedRoute><PriceQuotationPage /></ProtectedRoute>} />
          <Route path="/GI/SALES.aspx" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
          <Route path="/GI/SALES_RETURN.aspx" element={<ProtectedRoute><SalesReturnPage /></ProtectedRoute>} />
          <Route path="/GI/SERIAL_SEARCH.aspx" element={<ProtectedRoute><SerialSearchPage /></ProtectedRoute>} />
          <Route path="/GI/MOBILE_SEARCH.aspx" element={<ProtectedRoute><MobileSearchPage /></ProtectedRoute>} />
          <Route path="/GI/DATE_WISE_BILL_SEARCH.aspx" element={<ProtectedRoute><DateWiseBillSearchPage /></ProtectedRoute>} />

          {/* 6. Transfer (5) */}
          <Route path="/GI/STOCK_TR_COMM_TO_COMM.aspx" element={<ProtectedRoute><StockTransferCommPage /></ProtectedRoute>} />
          <Route path="/GI/STOCK_TR_BR_TO_BR.aspx" element={<ProtectedRoute><StockTransferBrPage /></ProtectedRoute>} />
          <Route path="/GI/STOCK_TR_COMM_TO_RMA.aspx" element={<ProtectedRoute><StockTransferCommToRmaPage /></ProtectedRoute>} />
          <Route path="/GI/STOCK_TR_RMA_TO_COMM.aspx" element={<ProtectedRoute><StockTransferRmaToCommPage /></ProtectedRoute>} />
          <Route path="/GI/STOCK_RECEIVED_BR_TO_BR_TR.aspx" element={<ProtectedRoute><StockReceivedBrToBrPage /></ProtectedRoute>} />

          {/* 7. RMA (5) */}
          <Route path="/GI/COMPLAIN_RECEIVE.aspx" element={<ProtectedRoute><ComplainReceivePage /></ProtectedRoute>} />
          <Route path="/GI/REPLACE_OUT.aspx" element={<ProtectedRoute><ReplaceOutPage /></ProtectedRoute>} />
          <Route path="/GI/REPLACE_IN.aspx" element={<ProtectedRoute><ReplaceInPage /></ProtectedRoute>} />
          <Route path="/GI/REPLACEMENT_DELIVERY.aspx" element={<ProtectedRoute><ReplacementDeliveryPage /></ProtectedRoute>} />
          <Route path="/GI/RMA_SERIAL_SEARCH.aspx" element={<ProtectedRoute><RmaSerialSearchPage /></ProtectedRoute>} />

          {/* 8. Servicing (5) */}
          <Route path="/GI/SERVICEGROUP.aspx" element={<ProtectedRoute><ServiceGroupPage /></ProtectedRoute>} />
          <Route path="/GI/PROBLEMGROUP.aspx" element={<ProtectedRoute><ProblemGroupPage /></ProtectedRoute>} />
          <Route path="/GI/SERVICE.aspx" element={<ProtectedRoute><ServicePage /></ProtectedRoute>} />
          <Route path="/GI/PROBLEM.aspx" element={<ProtectedRoute><ProblemPage /></ProtectedRoute>} />
          <Route path="/GI/SERVICEBILL.aspx" element={<ProtectedRoute><ServiceBillPage /></ProtectedRoute>} />

          {/* 9. Accounts (8) */}
          <Route path="/GI/PAYMENT.aspx" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="/GI/COLLECTIONS.aspx" element={<ProtectedRoute><CollectionPage /></ProtectedRoute>} />
          <Route path="/GI/BANKTRANSCATION.aspx" element={<ProtectedRoute><BankTransactionPage /></ProtectedRoute>} />
          <Route path="/GI/JOURNAL.aspx" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
          <Route path="/GI/CHEQUE_SEARCH.aspx" element={<ProtectedRoute><ChequeSearchPage /></ProtectedRoute>} />
          <Route path="/GI/DATE_WISE_COLLECTION_SEARCH.aspx" element={<ProtectedRoute><DateWiseCollectionSearchPage /></ProtectedRoute>} />
          <Route path="/GI/SALARY_PROCESS.aspx" element={<ProtectedRoute><SalaryProcessPage /></ProtectedRoute>} />
          <Route path="/GI/BALANCETRANSFER.aspx" element={<ProtectedRoute><BalanceTransferPage /></ProtectedRoute>} />

          {/* 10. Reports (9) */}
          <Route path="/GI/PURCHASE_REPORTS.aspx" element={<ProtectedRoute><PurchaseReportsPage /></ProtectedRoute>} />
          <Route path="/GI/SALES_REPORTS.aspx" element={<ProtectedRoute><SalesReportsPage /></ProtectedRoute>} />
          <Route path="/GI/CS_REPORTS.aspx" element={<ProtectedRoute><TradersReportsPage /></ProtectedRoute>} />
          <Route path="/GI/ACCOUNTS_REPORTS.aspx" element={<ProtectedRoute><AccountsReportsPage /></ProtectedRoute>} />
          <Route path="/GI/STOCK_REPORTS.aspx" element={<ProtectedRoute><StockReportsPage /></ProtectedRoute>} />
          <Route path="/GI/BANK_REPORTS.aspx" element={<ProtectedRoute><BankReportsPage /></ProtectedRoute>} />
          <Route path="/GI/RMA_REPORTS.aspx" element={<ProtectedRoute><RmaReportsPage /></ProtectedRoute>} />
          <Route path="/GI/MODIFICATION_REPORTS.aspx" element={<ProtectedRoute><ModificationReportsPage /></ProtectedRoute>} />
          <Route path="/GI/EXPORT_EXCEL.aspx" element={<ProtectedRoute><ExportExcelPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/GI/TREE.aspx" replace />} />
        </Routes>
      </BrowserRouter>
    </ErpProvider>
  );
}
