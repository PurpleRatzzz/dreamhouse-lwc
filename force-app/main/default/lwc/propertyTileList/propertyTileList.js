import { LightningElement, wire } from 'lwc';
import {
    publish,
    subscribe,
    unsubscribe,
    MessageContext
} from 'lightning/messageService';
import FILTERSCHANGEMC from '@salesforce/messageChannel/FiltersChange__c';
import PROPERTYSELECTEDMC from '@salesforce/messageChannel/PropertySelected__c';
import getPagedPropertyList from '@salesforce/apex/PropertyController.getPagedPropertyList';
import LOCALE from '@salesforce/i18n/locale';
import RESULT_COUNT_ONE from '@salesforce/label/c.PropertyTileList_ResultCount_One';
import RESULT_COUNT_OTHER from '@salesforce/label/c.PropertyTileList_ResultCount_Other';

const PAGE_SIZE = 9;

export default class PropertyTileList extends LightningElement {
    pageNumber = 1;
    pageSize = PAGE_SIZE;

    searchKey = '';
    maxPrice = 9999999;
    minBedrooms = 0;
    minBathrooms = 0;

    @wire(MessageContext)
    messageContext;

    // One label per plural form, picked with the user's plural rules, so every
    // language can phrase "N properties found" its own way.
    get resultCountText() {
        const count = this.properties.data.totalItemCount;
        const label =
            new Intl.PluralRules(LOCALE).select(count) === 'one'
                ? RESULT_COUNT_ONE
                : RESULT_COUNT_OTHER;
        return label.replace('{0}', new Intl.NumberFormat(LOCALE).format(count));
    }

    @wire(getPagedPropertyList, {
        searchKey: '$searchKey',
        maxPrice: '$maxPrice',
        minBedrooms: '$minBedrooms',
        minBathrooms: '$minBathrooms',
        pageSize: '$pageSize',
        pageNumber: '$pageNumber'
    })
    properties;

    connectedCallback() {
        this.subscription = subscribe(
            this.messageContext,
            FILTERSCHANGEMC,
            (message) => {
                this.handleFilterChange(message);
            }
        );
    }

    disconnectedCallback() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    handleFilterChange(filters) {
        this.searchKey = filters.searchKey;
        this.maxPrice = filters.maxPrice;
        this.minBedrooms = filters.minBedrooms;
        this.minBathrooms = filters.minBathrooms;
    }

    handlePreviousPage() {
        this.pageNumber = this.pageNumber - 1;
    }

    handleNextPage() {
        this.pageNumber = this.pageNumber + 1;
    }

    handlePropertySelected(event) {
        const message = { propertyId: event.detail };
        publish(this.messageContext, PROPERTYSELECTEDMC, message);
    }
}
