# Refactoring Toast Messages

I have refactored the application's toast messages to improve user feedback and standardize error handling.

## Changes Implemented

### 1. Centralized Error Handling
Created `src/lib/error-handler.ts` with a `handleApiError` utility function.
- **System Errors (500+)**: Logged to console (via `src/lib/logger.ts`) and shown as a generic "System Error" to the user, hiding technical details.
- **Client Errors (400-499)**: Shown with specific messages (e.g., "Invalid Data", "Access Denied", "Not Found") and the server-provided error message if available.
- **Network Errors**: Shown as "Connection Error".

### 2. Logger Utility
Created `src/lib/logger.ts` to wrap `console` methods, allowing for future extension (e.g., sending logs to an external service).

### 3. Component Updates
Updated the following components to use `handleApiError` instead of generic or manual error handling:

- **Authentication**: `src/components/auth/auth-form.tsx`
- **Transactions**:
  - `src/components/dashboard/transacoes/AddTransactionSheet.tsx`
  - `src/app/dashboard/transacoes/page.tsx`
- **Budgets**:
  - `src/components/dashboard/orcamentos/add-budget-form.tsx`
  - `src/app/dashboard/orcamentos/page.tsx`
- **Family**: `src/components/dashboard/family/invite-wizard.tsx`
- **File Upload**: `src/components/ui/file-upload.tsx`

## Verification

To verify the changes:
1.  **Trigger a Validation Error**: Try to submit a form with invalid data (e.g., empty required fields if client-side validation doesn't catch it, or mock a 400 response). You should see a specific error message.
2.  **Trigger a System Error**: Mock a 500 response from the API. You should see a generic "Erro no Sistema" message, and the full error should be logged in the console.
3.  **Trigger a Network Error**: Disconnect from the network and try an action. You should see "Erro de Conexão".

## Code Example

```typescript
import { handleApiError } from '@/lib/error-handler';

// ... inside a component
try {
  await api.post('/some-endpoint', data);
  toast({ title: 'Success!' });
} catch (error) {
  handleApiError(error, toast, 'Error Title');
}
```
