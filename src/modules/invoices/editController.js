define(['lodash'], function(_) {
    'use strict';
    return ['createOrUpdateModal.userdata', '$scope', 'Restangular', '$filter', function(invoice, $scope, Restangular, $filter) {
        var controller = this;
        $scope.invoice = _.clone(invoice, true);

        controller.onFail = function(response) {
            if (response.status === 409) {
                $scope.errors = [{
                    entity: 'invoice',
                    message: $filter('translate')('INVOICE.IDENTIFIER_CONFLICT'),
                    property: 'identifier'
                }];
            } else {
                $scope.errors = response.data.errors;
            }
        };

        controller.saveInvoice = function(invoice) {
            var invoiceEntity = _.pick(invoice, ['id', 'version', 'identifier', 'creationDate', 'invoiceTotal', 'dueDate']);

            if(invoice.debitor && invoice.debitor._links) {
                var debitorHref = invoice.debitor._links.self.href;
                invoiceEntity.debitor = debitorHref.substr(0, debitorHref.indexOf('{'));
            }

            var invoiceBase = Restangular.one('invoices', invoice.id);
            invoiceBase.patch(invoiceEntity)
                .then(function(result) {
                    if(!invoice.debitor) {
                        return invoiceBase.one('debitor').remove().then(function() {
                            return result;
                        });
                    } else {
                        return result;
                    }
                }).then(function(result) {
                    $scope.closeModal(result);
                }).catch(controller.onFail);
        };

        $scope.getCompanies = function(searchString) {
            return Restangular.allUrl('companies', 'api/companies/search/findByNameLikeIgnoreCaseOrderByNameAsc')
                .getList({name: '%' + searchString + '%'});
        };

        $scope.saveEntity = function() {
            controller.saveInvoice($scope.invoice);
        };
    }];
});