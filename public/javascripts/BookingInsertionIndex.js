export default class BookingInsertionIndex {
    /*
    * This class is used to find the correct index for inserting
    * booking in a list of bookings. The idea with this insertion
    * is that the booking of the same status should appear at the
    * same place in the following order:
    *       - booking ongoing
    *       - awaiting payment
    *       - accept/reject
    *       - awaiting confirmation, awaiting resolution and cancelled
    * */

    constructor(listOfProjects, target, newProjectDueDateTime) {
        this.listOfProjects = listOfProjects;
        this.status = status;
        this.newProjectDueDateTime = newProjectDueDateTime;
    }

    get sizeOfList(){
        return this.listOfProjects.length;
    }

    get firstIndex(){
        return 0;
    }

    updateProjectStatus(projectContainerHTML, newStatus){
        projectContainerHTML.firstChild.childNodes[3].innerText = newStatus;
    }

    getProjectDueTime(projectContainerHTML) {
        /* This method returns the due time
        * of the project.
        * Arguments:
        *   - projectContainerHTML: HTML container
        *       of a single project booking
        * */

        return projectContainerHTML.firstChild.childNodes[2].innerText;
    }

    getProjectStatus(projectContainerHTML) {
        /* This method returns the status
        * of the project.
        * Arguments:
        *   - projectContainerHTML: HTML container
        *       of a single project booking
        * */

        return projectContainerHTML.firstChild.childNodes[3].innerText;
    }

    getDueDateMilliseconds(time) {
        /* Gets the milliseconds of the date and time passed. */

        if(time.includes(',')){
            time = time.split(',');
            time = time[0].trim().split("/").reverse().join("-")+'T'+time[1].trim()+'Z';
        }
        return Date.parse(time);
    }

    findProjectInsertionIndex(listOfProjects, status, insertTime) {
        /* This method returns the exact index of the insertion of the
        * new project.
        * Arguments:
        *   - listOfProjects: List of the project apart from the Next Due Project
        *   - status: Status of the new project to be insert
        *   - insertTime: Due time of the new project to be insert
        * */

        let insertIndex;

        /* Find the first and last occurrence of the new project status in the list of
        all the projects.*/
        let firstStatusOccurence = this.findFirstIndex(listOfProjects, this.firstIndex, this.sizeOfList, status);
        let lastStatusOccurence = this.findEndIndex(listOfProjects, this.firstIndex, this.sizeOfList, status);

        if(firstStatusOccurence === -1 || lastStatusOccurence === -1){
            /* There no project in the list of all the projects that has the same
            status as the new project. The bext step becomes to be find the current
             index to insert it, based on the order the projects are expected to
             appear*/

            if(status === 'booking ongoing'){
                /* It is known that 'booking ongoing' are always first in the list.
                So, this project must be pushed on the top of the list. */
                insertIndex = {place: 'before', index: 0};

            }else{
                /* For projects with status 'accept / reject' or 'awaiting payment', the
                * function below is called to find the correct index of insertion. */

                insertIndex = this.correctInsertionIndex(listOfProjects, 0, this.sizeOfList, status);
            }
        }else{
            /* Now, if there are projects in the list of projects with the same status with the new
            * projects. The next step is to find the right index of insertion based on the due date & time. */

            // Get only projects with the same status as the new project.
            let listOfProjectsWithCurrentStatus = listOfProjects.slice(firstStatusOccurence, lastStatusOccurence+1);

            // For all the proejcts of the same status as the new one, compare the time in ascending order to find
            // insertion index for the new project.
            insertIndex = this.earliestDueTimeIndex(listOfProjectsWithCurrentStatus, this.firstIndex,
                listOfProjectsWithCurrentStatus.length, insertTime, firstStatusOccurence);
        }

        return insertIndex;
    }

    earliestDueTimeIndex(list, first, last, target, startIndex) {
        /* This method is used for finding the correct index to insert
        * a new project based on its due date & time.
        * Arguments:
        *   - list: List of the projects with the same status as the new project
        *   - first: the first index of this list (always 0)
        *   - last: the last index of this list (always length of list)
        *   - target: the due date & time in milliseconds of the new project.
        *   - startIndex: The list here is a sub-list of the list of all projects.
        *           This list passed to this function is broken based on the status
        *           of the new project. Now, startIndex represents the firs index where
        *           the list of all projects was broken.
        *  */

        let cutter = Math.floor(first + (last - first)/2);
        let middleElem = this.getDueDateMilliseconds(this.getProjectDueTime(list[cutter]));

        if(first <= last){
            if(middleElem >= target){ // target is less than or equal to the element in the midlle
                if(cutter === 0){
                    return {place: 'before', index: startIndex + cutter};
                }
                else if(this.getDueDateMilliseconds(this.getProjectDueTime(list[cutter-1])) < target){
                    return {place: 'before', index: startIndex + cutter};
                }else{
                    return this.earliestDueTimeIndex(list, first, cutter-1, target, startIndex);
                }
            }else{
                if(cutter === (list.length - 1)){
                    return {place: 'after', index: (last - 1)+startIndex};
                }
                return this.earliestDueTimeIndex(list, cutter+1, last, target, startIndex);
            }
        }
    }

    correctInsertionIndex(list, first, last, target) {
        let middleElem;
        let cutter = Math.floor(first + (last - first)/2);

        if(first < last){
            middleElem = this.getProjectStatus(list[cutter]);

            if(middleElem === 'booking ongoing'){
                if (cutter === 0){
                    return {place: 'after', index: last - 1};
                }
                return this.correctInsertionIndex(list, cutter+1, last, target);
            }else if(middleElem === 'awaiting payment'){
                if (cutter === 0 && target === 'accept / reject'){
                    return {place: 'after', index: last - 1};
                }
                return this.correctInsertionIndex(list, cutter+1, last, target);
            }else if(middleElem === 'accept / reject'){
                if (cutter === 0 && target === 'awaiting payment'){
                    return {place: 'before', index: cutter};
                }else if(this.getProjectStatus(list[cutter-1]) !== 'accept / reject'){
                    return {place: 'before', index: cutter};
                }
                return this.correctInsertionIndex(list, first, cutter - 1, target);
            }else if(middleElem === 'awaiting confirmation' || middleElem === 'awaiting resolution'
                || middleElem === 'cancelled'){
                //awaiting confirmation, awaiting resolution and cancelled
                if (cutter === 0){
                    return {place: 'before', index: cutter};
                }else if(this.getProjectStatus(list[cutter-1]) === 'booking ongoing' ||
                    this.getProjectStatus(list[cutter-1]) === 'awaiting payment'){
                    return {place: 'before', index: cutter};
                }else{
                    return this.correctInsertionIndex(list, first, cutter - 1, target);
                }
            }
        }else if(first === last){
            if( last !== 0 ){
                middleElem = this.getProjectStatus(list[cutter - 1]);
            }
            if(middleElem === 'awaiting confirmation' || middleElem === 'awaiting resolution'
                || middleElem === 'cancelled' || middleElem === 'accept / reject'){
                //awaiting confirmation, awaiting resolution and cancelled
                return {place: 'before', index: first};
            }
            return {place: 'after', index: last-1};
        }
        return -1 // never to be reached
    }

    findFirstIndex(list, first, last, target){
        let cutter = Math.floor(first + (last - first)/2);
        if(first < last){
            if(this.getProjectStatus(list[cutter]) === target){
                if(cutter === 0){
                    return cutter;
                }else if(target !== this.getProjectStatus(list[cutter-1])){
                    return cutter;
                }else if(target === this.getProjectStatus(list[cutter-1])){
                    return this.findFirstIndex(list, first, cutter-1 , target);
                }
            }else{
                if(target === 'accept / reject'){
                    if(this.getProjectStatus(list[cutter]) === 'awaiting confirmation' ||
                        this.getProjectStatus(list[cutter]) === 'awaiting resolution' ||
                        this.getProjectStatus(list[cutter]) === 'cancelled'){
                        //awaiting confirmation, awaiting resolution and cancelled
                        return this.findFirstIndex(list, first, cutter-1, target);
                    }
                    return this.findFirstIndex(list, cutter + 1, last, target);
                }else if(target === 'awaiting payment'){
                    if(this.getProjectStatus(list[cutter]) === 'accept / reject' ||
                        this.getProjectStatus(list[cutter]) === 'awaiting confirmation' ||
                        this.getProjectStatus(list[cutter]) === 'awaiting resolution' ||
                        this.getProjectStatus(list[cutter]) === 'cancelled'){
                        //awaiting confirmation, awaiting resolution and cancelled
                        return this.findFirstIndex(list, first, cutter - 1, target);
                    }
                    return this.findFirstIndex(list, cutter + 1, last, target);
                }else if (target === 'booking ongoing'){
                    return this.findFirstIndex(list, first, cutter - 1, target);
                }
            }
        }else if(first === last){
            if(cutter === this.sizeOfList){
                cutter--;
            }
            if(this.getProjectStatus(list[cutter]) === target){
                return cutter;
            }
        }
        return -1; // status passed is not in list
    }

    findEndIndex(list, first, last, target) {
        let cutter = Math.floor(first + (last - first)/2);

        if(first < last){
            if(this.getProjectStatus(list[cutter]) === target){
                if(cutter === this.sizeOfList-1){
                    return cutter;
                }else if(target !== this.getProjectStatus(list[cutter+1])){
                    return cutter;
                } else if(target === this.getProjectStatus(list[cutter+1])){
                    return this.findEndIndex(list, cutter+1, last, target);
                }
            }else{
                if(target === 'accept / reject'){
                    if(this.getProjectStatus(list[cutter]) === 'awaiting confirmation' ||
                        this.getProjectStatus(list[cutter]) === 'awaiting resolution' ||
                        this.getProjectStatus(list[cutter]) === 'cancelled'
                    ){
                        //awaiting confirmation, awaiting resolution and cancelled
                        return this.findEndIndex(list, first, cutter-1, target);
                    }
                    return this.findEndIndex(list, cutter + 1, last, target);
                }else if(target === 'awaiting payment'){
                    if(this.getProjectStatus(list[cutter]) === 'accept / reject' ||
                        this.getProjectStatus(list[cutter]) === 'awaiting confirmation' ||
                        this.getProjectStatus(list[cutter]) === 'awaiting resolution' ||
                        this.getProjectStatus(list[cutter]) === 'cancelled'){
                        //awaiting confirmation, awaiting resolution and cancelled
                        return this.findEndIndex(list, first, cutter - 1, target);
                    }
                    return this.findEndIndex(list, cutter + 1, last, target);
                }else if (target === 'booking ongoing'){
                    return this.findEndIndex(list, first, cutter - 1, target);
                }
            }
        }else if(first === last){
            if(cutter === this.sizeOfList){
                cutter--;
            }
            if(this.getProjectStatus(list[cutter]) === target){
                return cutter;
            }
        }
        return -1; // status passed is not in list
    }
}