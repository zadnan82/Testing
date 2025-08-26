import React from 'react';
import { Database, Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const ProductsTab = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-600">Manage your product requests</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Request Product
        </Button>
      </div>

      {/* Empty State */}
      <Card className="!p-6 sm:!p-12">
        <div className="text-center">
          <Database className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-600 mb-4 text-sm sm:text-base max-w-md mx-auto">
            Start by requesting your first product to begin generating code
          </p>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Request Product
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProductsTab;