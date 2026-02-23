const allPartsShopItems: PartsShopData[] = []

export default allPartsShopItems.sort((a, b) => {
    if (a.featured !== b.featured) {
        return a.featured ? -1 : 1
    } else {
        return a.title.localeCompare(b.title)
    }
})
