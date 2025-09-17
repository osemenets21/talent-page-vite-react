import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/24/outline'
import React from 'react';

export default function ({ open, setOpen, title, message }) {
  const safeTitle = typeof title === 'string' ? title : '';
  const safeMessage = typeof message === 'string' ? message : '';
  return (
    <Dialog open={open} onClose={setOpen} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl transition-all">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100">
            <CheckIcon className="size-6 text-green-600" />
          </div>
          <div className="mt-3 text-center">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900">
              {safeTitle}
            </DialogTitle>
            <div className="mt-2 text-sm text-gray-600">
              {safeMessage}
            </div>
          </div>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Close
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}